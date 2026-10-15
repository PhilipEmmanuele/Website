+++
title = "Closest Common Clade"
description = "A quick trivia game: given two animals, can you name the closest shared branch on the tree of life?"
date = 2026-02-13
[taxonomies]
tags = ["games", "biology", "evolution"]
+++

Two animals. One shared clade. How well do you know the tree of life?

You'll be shown two animals and asked to name their **closest common clade**: the most specific named group in the game’s curated tree that contains both of them. Learn the names in Branch by Branch study mode, play four-choice rounds, search for a group, or test your memory. Each session is 10 rounds, with no timer.

<iframe id="clade-game" src="/clade-game.html" title="Closest Common Clade animal ancestry game" style="width:100%; height:900px; border:none; border-radius:12px;" loading="lazy"></iframe>
<script>
window.addEventListener('message', function(e) {
  const frame = document.getElementById('clade-game');
  if (e.origin === window.location.origin && e.source === frame.contentWindow && e.data && e.data.type === 'clade-game-resize' && Number.isFinite(e.data.height) && e.data.height > 0 && e.data.height < 20000) {
    document.getElementById('clade-game').style.height = e.data.height + 'px';
  }
});
</script>