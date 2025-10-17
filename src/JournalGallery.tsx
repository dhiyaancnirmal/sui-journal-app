import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/2024.4";
import { Box, Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";

type JournalNode = {
    address: string;
    asMoveObject?: {
        contents?: {
            json?: {
                title?: string;
                owner?: string;
            };
        };
    };
};

export function JournalGallery({
    onSelectJournal,
}: {
    onSelectJournal: (id: string) => void;
}) {
    const graphqlUrl = useNetworkVariable("graphqlUrl");
    const journalPackageId = useNetworkVariable("journalPackageId");

    const [journals, setJournals] = useState<JournalNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [endCursor, setEndCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchJournals = async (cursor?: string | null) => {
        try {
            const client = new SuiGraphQLClient({ url: graphqlUrl });

            const query = graphql(`
        query GetJournals($type: String!, $after: String) {
          objects(filter: { type: $type }, first: 10, after: $after) {
            pageInfo {
              hasNextPage
              startCursor
              endCursor
            }
            nodes {
              address
              asMoveObject {
                contents {
                  json
                }
              }
            }
          }
        }
      `);

            const result = await client.query({
                query,
                variables: {
                    type: `${journalPackageId}::journal::Journal`,
                    after: cursor,
                },
            });

            if (result.data?.objects) {
                const nodes = result.data.objects.nodes as JournalNode[];
                setJournals((prev) => (cursor ? [...prev, ...nodes] : nodes));
                setHasNextPage(result.data.objects.pageInfo.hasNextPage);
                setEndCursor(result.data.objects.pageInfo.endCursor);
            }

            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load journals");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchJournals();
    }, [graphqlUrl, journalPackageId]);

    const loadMore = () => {
        setLoadingMore(true);
        fetchJournals(endCursor);
    };

    if (loading) {
        return (
            <Flex justify="center" align="center" p="6">
                <ClipLoader size={40} />
            </Flex>
        );
    }

    if (error) {
        return <Text color="red">Error loading gallery: {error}</Text>;
    }

    return (
        <Box>
            <Heading size="5" mb="4">
                All Journals
            </Heading>

            {journals.length === 0 ? (
                <Card>
                    <Text color="gray">No journals found on the network.</Text>
                </Card>
            ) : (
                <>
                    <Flex direction="column" gap="3">
                        {journals.map((journal) => {
                            const title = journal.asMoveObject?.contents?.json?.title || "Untitled Journal";
                            const owner = journal.asMoveObject?.contents?.json?.owner || "Unknown";

                            return (
                                <Card
                                    key={journal.address}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => onSelectJournal(journal.address)}
                                >
                                    <Heading size="3">{title}</Heading>
                                    <Text size="1" color="gray" mt="1">
                                        Owner: {owner.slice(0, 6)}...{owner.slice(-4)}
                                    </Text>
                                    <Text size="1" color="gray">
                                        ID: {journal.address}
                                    </Text>
                                </Card>
                            );
                        })}
                    </Flex>

                    {hasNextPage && (
                        <Flex justify="center" mt="4">
                            <Button onClick={loadMore} disabled={loadingMore}>
                                {loadingMore ? <ClipLoader size={20} /> : "Load More"}
                            </Button>
                        </Flex>
                    )}
                </>
            )}
        </Box>
    );
}
