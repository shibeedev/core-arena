<script lang="ts">
  import { page } from '$app/stores'

  $: {
    if (typeof gtag !== 'undefined') {
      gtag('config', 'G-H3VLXL4ZZ7', {
        page_title: document.title,
        page_path: $page.url.pathname
      })
    }
  }
</script>

<svelte:head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-H3VLXL4ZZ7"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-H3VLXL4ZZ7', { send_page_view: false });
    
  </script>
</svelte:head>
