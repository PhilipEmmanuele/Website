+++
title = "Closest Common Clade"
date = 2026-02-13
[taxonomies]
tags = ["games", "biology", "evolution"]
+++

Two animals. One shared clade. How well do you know the tree of life?

You'll be shown two animals and asked to name their **closest common clade**: the most specific group on the tree of life that contains both of them.

<iframe id="clade-game" src="/clade-game.html" style="width:100%; height:700px; border:none; border-radius:12px;" loading="lazy"></iframe>
<script>
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'clade-game-resize') {
    document.getElementById('clade-game').style.height = e.data.height + 'px';
  }
});
</script>