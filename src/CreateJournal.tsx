import { Transaction } from "@mysten/sui/transactions";
import { Button, Container, TextField } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";
import { useState } from "react";

export function CreateJournal({
    onCreated,
}: {
    onCreated: (id: string) => void;
}) {
    const journalPackageId = useNetworkVariable("journalPackageId");
    const client = useSuiClient();
    const me = useCurrentAccount();
    const [journalTitle, setJournalTitle] = useState("");
    const {
        mutate: signAndExecute,
        isSuccess,
        isPending,
    } = useSignAndExecuteTransaction();

    function makeOne() {
        if (!me) return;

        const txn = new Transaction();

        const newJournal = txn.moveCall({
            arguments: [txn.pure.string(journalTitle)],
            target: `${journalPackageId}::journal::new_journal`,
        });

        txn.transferObjects([newJournal], me.address);

        signAndExecute(
            {
                transaction: txn,
            },
            {
                onSuccess: async ({ digest }) => {
                    const { effects } = await client.waitForTransaction({
                        digest,
                        options: { showEffects: true },
                    });

                    onCreated(effects?.created?.[0]?.reference?.objectId!);
                },
            },
        );
    }

    return (
        <Container>
            <TextField.Root
                placeholder="Enter journal title"
                value={journalTitle}
                onChange={(e) => setJournalTitle(e.target.value)}
                size="3"
                mb="3"
            />
            <Button
                size="3"
                onClick={() => {
                    makeOne();
                }}
                disabled={isSuccess || isPending || !journalTitle.trim()}
            >
                {isSuccess || isPending ? <ClipLoader size={20} /> : "Create Journal"}
            </Button>
        </Container>
    );
}
