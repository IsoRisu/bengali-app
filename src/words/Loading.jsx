// Shared loading / error screen for the word decks.
export function WordsLoading({ error, retry, back = '#/words', backLabel = '← Words' }) {
  return (
    <main class="page">
      <a class="back" href={back}>{backLabel}</a>
      {error ? (
        <>
          <h1>Could not load words</h1>
          <p>Check your connection and try again.</p>
          <div class="actions">
            <button type="button" class="btn btn-primary" onClick={retry}>Try again</button>
          </div>
        </>
      ) : (
        <p class="muted" role="status">Loading words…</p>
      )}
    </main>
  );
}
