const fs = require('fs');

function patch(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix messages schema policy
  content = content.replace(
    /CREATE POLICY messages_select_participant ON public\.messages\n  FOR SELECT USING \(public\.is_my_conversation\(conversation_id\)\);/g,
    `CREATE POLICY messages_select_participant ON public.messages
  FOR SELECT USING (sender_id = public.auth_user_id() OR receiver_id = public.auth_user_id() OR public.is_my_conversation(conversation_id));`
  );

  fs.writeFileSync(file, content);
}

patch('schema.sql');
patch('../schema.sql');
console.log('schema patched.');
