-- Create messages table for user-to-user messaging
-- This table stores messages between users (buyers, sellers, support)

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create conversations table to group related messages
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_1_id uuid not null references public.profiles(id) on delete cascade,
  participant_2_id uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz default now(),
  last_message_id uuid references public.messages(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Ensure unique conversation between two users
  constraint unique_conversation unique (participant_1_id, participant_2_id),
  -- Ensure participant_1_id < participant_2_id to avoid duplicate conversations
  constraint participant_order check (participant_1_id < participant_2_id)
);

-- Add foreign key from messages to conversations
alter table public.messages
  add constraint messages_conversation_id_fkey
  foreign key (conversation_id)
  references public.conversations(id)
  on delete cascade;

-- Create indexes for faster queries
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_messages_recipient_id on public.messages(recipient_id);
create index if not exists idx_messages_created_at on public.messages(created_at desc);
create index if not exists idx_conversations_participant_1 on public.conversations(participant_1_id);
create index if not exists idx_conversations_participant_2 on public.conversations(participant_2_id);
create index if not exists idx_conversations_last_message_at on public.conversations(last_message_at desc);

-- Enable RLS
alter table public.messages enable row level security;
alter table public.conversations enable row level security;

-- RLS Policies for conversations
-- Users can view conversations they are part of
create policy "Users can view own conversations"
  on public.conversations
  for select
  to authenticated
  using (
    participant_1_id = auth.uid() or
    participant_2_id = auth.uid()
  );

-- Users can create conversations
create policy "Users can create conversations"
  on public.conversations
  for insert
  to authenticated
  with check (
    participant_1_id = auth.uid() or
    participant_2_id = auth.uid()
  );

-- Users can update their own conversations
create policy "Users can update own conversations"
  on public.conversations
  for update
  to authenticated
  using (
    participant_1_id = auth.uid() or
    participant_2_id = auth.uid()
  )
  with check (
    participant_1_id = auth.uid() or
    participant_2_id = auth.uid()
  );

-- RLS Policies for messages
-- Users can view messages in conversations they are part of
create policy "Users can view messages in own conversations"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and (
        conversations.participant_1_id = auth.uid() or
        conversations.participant_2_id = auth.uid()
      )
    )
  );

-- Users can send messages in conversations they are part of
create policy "Users can send messages in own conversations"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and (
        conversations.participant_1_id = auth.uid() or
        conversations.participant_2_id = auth.uid()
      )
    )
  );

-- Users can update their own messages (mark as read, edit)
create policy "Users can update own messages"
  on public.messages
  for update
  to authenticated
  using (
    sender_id = auth.uid() or
    recipient_id = auth.uid()
  )
  with check (
    sender_id = auth.uid() or
    recipient_id = auth.uid()
  );

-- Service role can manage all messages
create policy "Allow service role to manage messages"
  on public.messages
  for all
  to service_role
  using (true)
  with check (true);

create policy "Allow service role to manage conversations"
  on public.conversations
  for all
  to service_role
  using (true)
  with check (true);

-- Create function to update conversation's last_message_at
create or replace function update_conversation_last_message()
returns trigger as $$
begin
  update public.conversations
  set
    last_message_at = new.created_at,
    last_message_id = new.id,
    updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

-- Create trigger to update conversation when message is created
create trigger update_conversation_on_message
  after insert on public.messages
  for each row
  execute function update_conversation_last_message();

-- Create function to update updated_at timestamps
create or replace function update_messages_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_messages_updated_at
  before update on public.messages
  for each row
  execute function update_messages_updated_at();

create trigger update_conversations_updated_at
  before update on public.conversations
  for each row
  execute function update_messages_updated_at();

-- Add comments
comment on table public.conversations is 'Groups messages between two users';
comment on table public.messages is 'Individual messages between users';
comment on column public.messages.read_at is 'Timestamp when recipient read the message';

