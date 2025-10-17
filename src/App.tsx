import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { useState } from "react";
import { Journal } from "./Journal";
import { CreateJournal } from "./CreateJournal";
import { JournalList } from "./JournalList";
import { JournalGallery } from "./JournalGallery";

function App() {
  const currentAccount = useCurrentAccount();
  const [journalId, setJournal] = useState(() => {
    const hash = window.location.hash.slice(1);
    return isValidSuiObjectId(hash) ? hash : null;
  });

  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading>Journal App</Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          {currentAccount ? (
            journalId ? (
              <Journal
                id={journalId}
                onBack={() => {
                  window.location.hash = "";
                  setJournal(null);
                }}
              />
            ) : (
              <Flex direction="column" gap="6">
                <CreateJournal
                  onCreated={(id) => {
                    window.location.hash = id;
                    setJournal(id);
                  }}
                />
                <JournalList
                  onSelectJournal={(id) => {
                    window.location.hash = id;
                    setJournal(id);
                  }}
                />
                <JournalGallery
                  onSelectJournal={(id) => {
                    window.location.hash = id;
                    setJournal(id);
                  }}
                />
              </Flex>
            )
          ) : (
            <Heading>Please connect your wallet</Heading>
          )}
        </Container>
      </Container>
    </>
  );
}

export default App;
