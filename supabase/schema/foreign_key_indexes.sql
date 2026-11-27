-- Applied to dedicated Avara project in migration avara_foreign_key_indexes.
create index if not exists avara_blocks_user_idx on public.avara_conversation_blocks(user_id);
create index if not exists avara_favorites_property_idx on public.avara_favorites(property_id);
create index if not exists avara_messages_sender_idx on public.avara_messages(sender_id);
create index if not exists avara_moderation_actor_idx on public.avara_moderation_events(actor_id);
create index if not exists avara_moderation_property_idx on public.avara_moderation_events(property_id);
