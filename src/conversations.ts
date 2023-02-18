import axios from "axios";
import fs from "fs";
import {
  ConversationDetails,
  ConversationItem,
  ConversationResponse,
} from "./types";

const ENDPOINTS = {
  list: {
    method: "GET",
    url: "https://chat.openai.com/backend-api/conversations",
    offsetParam: "offset",
    limitParam: "limit",
    maxLimit: 100,
  },
  get: {
    method: "GET",
    url: "https://chat.openai.com/backend-api/conversation/{uuid}",
  },
};

const RATELIMIT_WAIT_TIME = 60001;
const PER_REQUEST_WAIT_TIME = 1250;

/**
 * Fetch a single page of conversation items from the OpenAI API.
 *
 * @param {number} offset - The offset to use for the request
 * @param {number} limit - The limit to use for the request
 * @param {Record<string, string>} headers - The headers to use for the request
 *
 * @returns {Promise<ConversationResponse>} - A page of conversation items
 */
export async function getConversationPage(
  offset: number,
  limit: number,
  headers: Record<string, string>
): Promise<ConversationResponse> {
  const { method, url, offsetParam, limitParam } = ENDPOINTS.list;

  const response = await axios.request<ConversationResponse>({
    url: url,
    method,
    headers,
    params: {
      [offsetParam]: offset,
      [limitParam]: limit,
    },
  });

  await new Promise((resolve) => setTimeout(resolve, PER_REQUEST_WAIT_TIME));

  return response.data;
}

/**
 * Fetch all conversation items from the OpenAI API.
 *
 * Any time the response is not successful or an error is thrown, wait a bit and try again.
 *
 * @param {Record<string, string>} headers - The headers to use for the request
 * @returns {Promise<ConversationItem[]>} - A list of conversation objects
 */
export async function getAllConversationPages(
  headers: Record<string, string>
): Promise<ConversationItem[]> {
  const { maxLimit } = ENDPOINTS.list;
  const conversations: ConversationItem[] = [];

  let offset = 0;
  let limit = maxLimit;
  let total = 0;

  do {
    try {
      const response = await getConversationPage(offset, limit, headers);
      conversations.push(...response.items);
      offset = response.offset;
      limit = response.limit;
      total = response.total;
    } catch (error) {
      console.error(
        `Error fetching conversation page (offset = ${offset}, limit = ${limit}). Waiting ${RATELIMIT_WAIT_TIME} ms and trying again.`
      );
      await new Promise((resolve) => setTimeout(resolve, RATELIMIT_WAIT_TIME));
    }
  } while (conversations.length < total);

  console.info(`Found ${conversations.length} conversations.`);

  return conversations;
}

/**
 * Given a conversation `uuid`, fetch the conversation detail from the OpenAI API.
 *
 * @param {string} uuid - The conversation uuid
 * @param {Record<string, string>} headers - The headers to use for the request
 */
export async function getConversationDetails(
  uuid: string,
  headers: Record<string, string>
): Promise<ConversationDetails> {
  const { method, url } = ENDPOINTS.get;

  const response = await axios.request<ConversationDetails>({
    url: url.replace("{uuid}", uuid),
    method: method,
    headers,
  });

  await new Promise((resolve) => setTimeout(resolve, PER_REQUEST_WAIT_TIME));

  return response.data;
}

/**
 * Return a dictionary of conversation details, keyed by conversation uuid.
 *
 * @param {Record<string, string>} headers - The headers to use for the request
 * @returns {Promise<Record<string, ConversationDetails>>} - A dictionary of conversation details
 */
export async function getAllConversationDetails(
  headers: Record<string, string>
): Promise<Record<string, ConversationDetails>> {
  const conversationItems = await getAllConversationPages(headers);
  const conversationDetails: Record<string, ConversationDetails> = {};

  for (const item of conversationItems) {
    try {
      console.info(`Fetching details for conversation ${item.id}...`);
      conversationDetails[item.id] = await getConversationDetails(
        item.id,
        headers
      );
    } catch (error) {
      console.error(
        `Error fetching conversation details for ${item.id}. Waiting ${RATELIMIT_WAIT_TIME}ms and trying again.`
      );
      await new Promise((resolve) => setTimeout(resolve, RATELIMIT_WAIT_TIME));
    }
  }

  return conversationDetails;
}

/**
 * Save all conversation details to a file.
 *
 * @param {string} outputPath - The path to save the conversation details to
 * @param {Record<string, string>} headers - The headers to use for the request
 */
export async function saveAllConversationDetails(
  outputPath: string,
  headers: Record<string, string>
): Promise<void> {
  const conversationDetails = await getAllConversationDetails(headers);

  console.info(`Saving conversation details to ${outputPath}...`);
  fs.writeFileSync(outputPath, JSON.stringify(conversationDetails, null, 2));
}
