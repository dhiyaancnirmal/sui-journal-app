import {
    useCurrentAccount,
    useSignAndExecuteTransaction,
    useSuiClient,
    useSuiClientQuery,
} from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Flex, Heading, Text, TextArea, Box } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";

export function Journal({ id, onBack }: { id: string; onBack: () => void }) {
    const journalPackageId = useNetworkVariable("journalPackageId");
    const client = useSuiClient();
    const me = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    const { data, isPending, error, refetch } = useSuiClientQuery("getObject", {
        id,
        options: {
            showContent: true,
            showOwner: true,
        },
    });

    const [waiting, setWaiting] = useState(false);
    const [entryText, setEntryText] = useState("");

    const addEntry = () => {
        if (!entryText.trim()) return;
        setWaiting(true);

        const tx = new Transaction();

        tx.moveCall({
            arguments: [
                tx.object(id),
                tx.pure.string(entryText),
                tx.object.clock()
            ],
            target: `${journalPackageId}::journal::add_entry`,
        });

        signAndExecute(
            {
                transaction: tx,
            },
            {
                onSuccess: (tx) => {
                    client.waitForTransaction({ digest: tx.digest }).then(async () => {
                        await refetch();
                        setWaiting(false);
                        setEntryText("");
                    });
                },
                onError: () => {
                    setWaiting(false);
                },
            },
        );
    };

    if (isPending) return <Text>Loading...</Text>;

    if (error) return <Text>Error: {error.message}</Text>;

    if (!data.data) return <Text>Not found</Text>;

    const journalFields = getJournalFields(data.data);
    const ownedByMe = journalFields?.owner === me?.address;

    return (
        <>
            <Flex justify="between" align="center" mb="3">
                <Heading size="3">{journalFields?.title || "Journal"}</Heading>
                <Button variant="soft" onClick={onBack}>
                    Back to Journals
                </Button>
            </Flex>

            <Flex direction="column" gap="4" mt="4">
                <Box>
                    <Heading size="2" mb="2">
                        Past Entries
                    </Heading>
                    {journalFields?.entries && journalFields.entries.length > 0 ? (
                        <Flex direction="column" gap="3">
                            {journalFields.entries.map((entry: any, index: number) => (
                                <Box
                                    key={index}
                                    p="3"
                                    style={{
                                        background: "var(--gray-a3)",
                                        borderRadius: "var(--radius-2)",
                                    }}
                                >
                                    <Text size="1" color="gray" mb="1">
                                        {formatTimestamp(entry.create_at_ms)}
                                    </Text>
                                    <Text m="1">{entry.content}</Text>
                                </Box>
                            ))}
                        </Flex>
                    ) : (
                        <Text color="gray">No entries yet</Text>
                    )}
                </Box>

                {ownedByMe && (
                    <Box>
                        <Heading size="2" mb="2">
                            Add New Entry
                        </Heading>
                        <Flex direction="column" gap="2">
                            <TextArea
                                placeholder="Write your journal entry here..."
                                value={entryText}
                                onChange={(e) => setEntryText(e.target.value)}
                                disabled={waiting}
                                rows={4}
                            />
                            <Button
                                onClick={addEntry}
                                disabled={waiting || !entryText.trim()}
                            >
                                {waiting ? <ClipLoader size={20} /> : "Add Entry"}
                            </Button>
                        </Flex>
                    </Box>
                )}
            </Flex>
        </>
    );
}

function getJournalFields(data: SuiObjectData) {
    if (data.content?.dataType !== "moveObject") {
        return null;
    }

    const fields = data.content.fields as {
        owner: string;
        title: string;
        entries: Array<{ fields: { content: string; create_at_ms: string } }>;
    };

    return {
        owner: fields.owner,
        title: fields.title,
        entries: fields.entries.map((entry) => entry.fields),
    };
}

function formatTimestamp(timestampMs: string): string {
    const date = new Date(parseInt(timestampMs));
    return date.toLocaleString();
}
