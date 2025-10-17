import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { Box, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";

export function JournalList({
    onSelectJournal,
}: {
    onSelectJournal: (id: string) => void;
}) {
    const currentAccount = useCurrentAccount();
    const journalPackageId = useNetworkVariable("journalPackageId");

    const { data, isPending, error } = useSuiClientQuery("getOwnedObjects", {
        owner: currentAccount?.address,
        filter: {
            StructType: `${journalPackageId}::journal::Journal`,
        },
        options: {
            showContent: true,
            showType: true,
        },
    }, {
        enabled: !!currentAccount?.address,
    });

    if (isPending) {
        return (
            <Flex justify="center" align="center" p="6">
                <ClipLoader size={40} />
            </Flex>
        );
    }

    if (error) {
        return <Text color="red">Error loading journals: {error.message}</Text>;
    }

    const journals = data?.data || [];

    return (
        <Box>
            <Heading size="5" mb="4">
                My Journals
            </Heading>

            {journals.length === 0 ? (
                <Card>
                    <Text color="gray">
                        You don't have any journals yet. Create your first journal to get
                        started!
                    </Text>
                </Card>
            ) : (
                <Flex direction="column" gap="3">
                    {journals.map((journal) => {
                        const content = journal.data?.content;
                        const fields =
                            content?.dataType === "moveObject"
                                ? (content.fields as { title: string; owner: string })
                                : null;

                        return (
                            <Card
                                key={journal.data?.objectId}
                                style={{ cursor: "pointer" }}
                                onClick={() => onSelectJournal(journal.data?.objectId!)}
                            >
                                <Heading size="3">{fields?.title || "Untitled Journal"}</Heading>
                                <Text size="1" color="gray" mt="1">
                                    ID: {journal.data?.objectId}
                                </Text>
                            </Card>
                        );
                    })}
                </Flex>
            )}
        </Box>
    );
}
