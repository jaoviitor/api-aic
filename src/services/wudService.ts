import { wudDb } from "../config/database";

export const getUserConversations = async (userId: number) => {
    const client = await wudDb.connect();

    try {
        const query = `
      SELECT 
          c.id AS conversation_id,
          c.title,
          c.is_shared,
          c.share_url,
          c.created_at AS conversation_created_at,
          c.updated_at AS conversation_updated_at,
          m.id AS message_id,
          m.sender,
          m.content,
          m.created_at AS message_created_at,
          r.id AS reaction_id,
          r.reaction,
          r.created_at AS reaction_created_at
      FROM public.conversations c
      LEFT JOIN public.messages m ON c.id = m.conversation_id
      LEFT JOIN public.message_reactions r ON m.id = r.message_id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC, m.created_at ASC;
    `;

    const result = await client.query(query, [userId]);
    return result.rows;

    } catch (error) {
        throw new Error(`Erro ao buscar conversas do usuário: ${error.message}`);
    } finally {
        client.release();
    }
};