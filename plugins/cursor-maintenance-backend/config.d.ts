export interface Config {
  cursor?: {
    maintenance?: {
      /**
       * Cursor API key for cloud maintenance agents.
       * @visibility secret
       */
      apiKey?: string;
    };
  };
}
