import axios from "axios";
import fs from "fs";

const method = "GET";
const endpoint = "https://chat.openai.com/backend-api/conversations";
const offsetParam = "offset";
const limitParam = "limit";

const getItemMethod = "GET";
const getItemEndpoint =
  "https://chat.openai.com/backend-api/conversation/{uuid}";

const shortAwaitDuration = 100;
const longAwaitDuration = 60000;

export type ConversationItem = {
  create_time: string;
  id: string;
  title: string;
};

export type ConversationResponse = {
  items: ConversationItem[];
  offset: number;
  limit: number;
  total: number;
};

export type ConversationDetails = string;

/**
 * Fetch all conversation items from the OpenAI API.
 *
 * @param {Record<string, string>} headers - The headers to use for the request
 * @returns {Promise<ConversationItem[]>} - A list of conversation objects
 */
export async function getAllConversations(
  headers: Record<string, string>
): Promise<ConversationItem[]> {
  const conversations: ConversationItem[] = [];

  let offset = 0;
  let limit = 100;
  let total = 1;

  while (conversations.length < total) {
    const response = await axios.request<ConversationResponse>({
      url: endpoint,
      method,
      headers,
      params: {
        [offsetParam]: offset,
        [limitParam]: limit,
      },
    });
    conversations.push(...response.data.items);
    offset += limit;
    total = response.data.total;

    // Wait a bit to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, shortAwaitDuration));
  }

  console.info(`Fetched ${conversations.length} conversations.`);

  return conversations;
}

/**
 * Given a conversation `uuid`, fetch the conversation detail from the OpenAI API.
 *
 * If the response is not successful or an error is thrown, wait 60 seconds and try again.
 *
 * @param {string} uuid - The conversation uuid
 * @param {Record<string, string>} headers - The headers to use for the request
 */
export async function getConversationDetails(
  uuid: string,
  headers: Record<string, string>
): Promise<ConversationDetails> {
  const endpoint = getItemEndpoint.replace("{uuid}", uuid);

  try {
    const response = await axios.request<ConversationDetails>({
      url: endpoint,
      method: getItemMethod,
      headers,
    });

    await new Promise((resolve) => setTimeout(resolve, shortAwaitDuration));

    return response.data;
  } catch (error) {
    console.error(
      `Error fetching conversation details for ${uuid}. Waiting 60 seconds and trying again.`
    );
    await new Promise((resolve) => setTimeout(resolve, longAwaitDuration));
    return getConversationDetails(uuid, headers);
  }
}

export async function getAllConversationDetails(
  headers: Record<string, string>
): Promise<Record<string, ConversationDetails>> {
  const conversations = await getAllConversations(headers);
  const conversationDetails: Record<string, ConversationDetails> = {};

  for (const conversation of conversations) {
    console.info(`Fetching details for conversation ${conversation.id}...`);
    conversationDetails[conversation.id] = await getConversationDetails(
      conversation.id,
      headers
    );
  }

  return conversationDetails;
}

/**
 * Save all conversation details to a file.
 *
 * @param headers
 */
export async function saveAllConversationDetails(
  outputPath: string,
  headers: Record<string, string>
): Promise<void> {
  const conversationDetails = await getAllConversationDetails(headers);
  fs.writeFileSync(outputPath, JSON.stringify(conversationDetails));
}
