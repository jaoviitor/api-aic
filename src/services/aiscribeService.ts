import { poolAiScribe } from "../config/database";

export const getMeetingsWithDetails = async () => {
    const client = await poolAiScribe.connect();
    try {
      const query = `
        SELECT 
            "Meeting".*,
            JSON_AGG(DISTINCT "Task") AS tasks,
            JSON_AGG(DISTINCT "Decision") AS decisions,
            JSON_AGG(DISTINCT "Question") AS questions,
            JSON_AGG(DISTINCT "Insight") AS insights,
            JSON_AGG(DISTINCT "Deadline") AS deadlines,
            JSON_AGG(DISTINCT "Attendee") AS attendees,
            JSON_AGG(DISTINCT "FollowUp") AS followUps,
            JSON_AGG(DISTINCT "Risk") AS risks,
            JSON_AGG(DISTINCT "AgendaItem") AS agendaItems
        FROM "Meeting"
        LEFT JOIN "Task" ON "Task"."meetingId" = "Meeting"."id"
        LEFT JOIN "Decision" ON "Decision"."meetingId" = "Meeting"."id"
        LEFT JOIN "Question" ON "Question"."meetingId" = "Meeting"."id"
        LEFT JOIN "Insight" ON "Insight"."meetingId" = "Meeting"."id"
        LEFT JOIN "Deadline" ON "Deadline"."meetingId" = "Meeting"."id"
        LEFT JOIN "Attendee" ON "Attendee"."meetingId" = "Meeting"."id"
        LEFT JOIN "FollowUp" ON "FollowUp"."meetingId" = "Meeting"."id"
        LEFT JOIN "Risk" ON "Risk"."meetingId" = "Meeting"."id"
        LEFT JOIN "AgendaItem" ON "AgendaItem"."meetingId" = "Meeting"."id"
        GROUP BY "Meeting"."id";
      `;
  
      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Erro ao buscar dados: ${error.message}`);
    } finally {
      client.release();
    }
  };

  export async function createMeeting(meetingData: any) {
    const { name, description, rawTranscript, summary } = meetingData;

    if (!name || !description || !rawTranscript || !summary) {
        throw new Error("Todos os campos são obrigatórios");
      }

    const client = await poolAiScribe.connect();
    try {
        const meetingQuery = `
            INSERT INTO "Meeting" ("name", "description", "rawTranscript", "summary")
            VALUES ($1, $2, $3, $4)
            RETURNING *;
    `;

    const meetingResult = await client.query(meetingQuery, [
        name,
        description,
        rawTranscript,
        summary,
    ]);
  
    return meetingResult.rows[0];
    } catch (error) {
      throw new Error(`Erro ao inserir reunião: ${error.message}`);
    } finally {
      client.release();
    }
  }

export const getMeetingsLeadsVenda = async () => {
    const client = await poolAiScribe.connect();

    try {
      const query = `SELECT * FROM public.leads_venda;`
      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Erro ao buscar dados: ${error.message}`);
    } finally {
      client.release();
    }
};