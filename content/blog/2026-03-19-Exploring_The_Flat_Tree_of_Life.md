+++
title = "Exploring The Flat Tree of Life"
date = 2026-03-19
[taxonomies]
tags = ["biology", "evolution", "machine-learning", "interactive"]
+++

If you read my previous post [‘From Darwin to Deep Learning’](/blog/from-darwin-to-deep-learning/), you will be familiar with the work that Goodfire AI did on the Evo 2 foundational DNA model. One of the aspects of the work that I found most interesting was the flat representation of the tree of life, where they reduced the embeddings of all sampled bacteria (2400 diverse species) to just 10 dimensions, while preserving ~70% of the variance. I was floored by this. Just by tuning 10 “knobs”, you can traverse a whole main kingdom of the tree of life. I thought it could make a cool visualizer from this and maybe by playing around with it, I could figure out what the knobs represent (organelles, optimal environment, cell membrane characteristics, etc…). In reality, each dimension is probably a mix of characteristics. Below you will find the simulation I made using their data. Please reach out if you figure out what any of the knobs tune for! Thanks to Dr. Michael Pearce for supplying the data! 

<iframe id="phylo-tuner" src="/phylo-tuner/index.html" scrolling="no" style="width:100%; max-width:none; height:850px; border:none; border-radius:8px; display:block;" loading="lazy"></iframe>
<script>
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'phylo-tuner-resize') {
    document.getElementById('phylo-tuner').style.height = e.data.height + 'px';
  }
});
</script>

Remember that we are visualizing 10 dimensions in 3D space. This is why the calculated nearest neighbors to each species do not always appear closest in 3D space. If you are annoyed by the formatting of this page, you can view the simulation on its own page [here](/phylo-tuner/index.html).