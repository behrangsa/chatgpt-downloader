/**
 * Basic details about a conversation item.
 */
export type ConversationItem = {
  create_time: string;
  id: string;
  title: string;
};

/**
 * The response from the OpenAI API when fetching a conversation page.
 */
export type ConversationResponse = {
  items: ConversationItem[];
  offset: number;
  limit: number;
  total: number;
};

/**
 * The details of a conversation item in raw JSON.
 */
export type ConversationDetails = string;
