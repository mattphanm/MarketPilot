export type PlaybookDto = {
  id: string;
  name: string;
  description: string;
  color: string;
  rules: string[];
  createdAt: string;
  updatedAt: string;
};

export type PlaybookPayload = {
  name: string;
  description: string;
  color: string;
  rules: string[];
};
