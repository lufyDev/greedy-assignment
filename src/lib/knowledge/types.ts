export type SourceSection = {
  id: string;
  heading: string;
  text: string;
};

export type WebsiteSource = {
  id: string;
  title: string;
  url: string;
  /** ISO date (YYYY-MM-DD) the text was captured from the live page. */
  capturedAt: string;
  sections: SourceSection[];
};

/** One section returned by retrieval, with enough context to cite it. */
export type RetrievedChunk = {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string;
  heading: string;
  text: string;
  score: number;
};
