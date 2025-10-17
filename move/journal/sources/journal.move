module journal::journal {
    use std::string::String;
    use sui::clock::Clock;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    public struct Journal has key, store {
        id: UID,
        owner: address,
        title: String,
        entries: vector<Entry>
    }

    public struct Entry has store {
        content: String,
        create_at_ms: u64
    }

    public fun new_journal(title: String, ctx: &mut TxContext): Journal {
        Journal {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            title,
            entries: vector::empty()
        }
    }

    public fun add_entry(journal: &mut Journal, content: String, clock: &Clock, ctx: &TxContext) {
        assert!(journal.owner == tx_context::sender(ctx), 0);
        
        let entry = Entry {
            content,
            create_at_ms: clock.timestamp_ms()
        };
        
        vector::push_back(&mut journal.entries, entry);
    }
}