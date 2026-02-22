+++
title = "AST SpaceMobile Constellation Tracker"
date = 2026-02-22
[taxonomies]
tags = ["AST Spacemobile", "Space", "Satellite", "Constellation", "BlueBird"]
+++

Satellite hunting is one of my favorite hobbies. I have been interested in AST Spacemobile for a while now because of their potential to revolutionize cellular connectivity. Here, we can track the real-time positions of AST Spacemobile's satellites in 3D space.

<div style="width:95vw; max-width:1600px; position:relative; left:50%; transform:translateX(-50%);">
<iframe id="ast-spacemobile-tracker" src="/ast-spacemobile-tracker.html" style="width:100% !important; max-width:none !important; height:800px; border:none; border-radius:4px; display:block;" loading="lazy"></iframe>
</div>
<script>
// Prevent scroll wheel from scrolling the parent page when over the tracker
const trackerFrame = document.getElementById('ast-spacemobile-tracker');
trackerFrame.addEventListener('mouseenter', function() {
  document.body.style.overflow = 'hidden';
});
trackerFrame.addEventListener('mouseleave', function() {
  document.body.style.overflow = '';
});
</script>