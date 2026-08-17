globalThis.source = {
  async search(query, page) {
    const trimmed = String(query || "").trim();
    if (!trimmed) {
      return { manga: [], hasNextPage: false };
    }

    // Replace this with the source's real request flow.
    // Example:
    // const response = await mihon.requestJSON({
    //   url: `https://example.org/api/search?q=${encodeURIComponent(trimmed)}&page=${page}`
    // });

    return { manga: [], hasNextPage: false };
  },

  async details(manga) {
    return manga;
  },

  async chapters(manga) {
    return [];
  },

  async pages(chapter) {
    return [];
  }
};
