<script>
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';

  // Default values
  let defaultTitle = "CORE ARENA - PvP Arena Game for any NFT on CORE";
  let defaultDescription = "A PvP game for every NFT on CORE: form squads with any ERC-721 NFT, unleash unique skills from each NFT trait, and solo others for staked $CORE";
  let defaultKeyword = "Core Arena, PvP, Gamefi, Core"
  // Base URL for your site
  const baseUrl = "https://corearena.xyz";

  // Derive the full URL for the current page
  const url = derived(page, $page => `${baseUrl}${$page.url.pathname}`);

  // Reactive variables for SEO
  export let title;
  export let description;
  export let keywords;
  // Update values based on the page
  $: {
    title = title || defaultTitle;
    description = description || defaultDescription;
    keywords  = keywords || defaultKeyword;
  }
</script>

<svelte:head>
  <!-- Canonical Tag -->
  <link rel="canonical" href={$url} />

  <!-- Primary Meta Tags -->
  <title>{title}</title>
  <meta name="title" content={title} />
  <meta name="description" content={description} />
</svelte:head>

