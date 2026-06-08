<section class="profile-hero" aria-label="Profile">
  <div class="profile-hero__image">
    <img src="{{ site.author.avatar | relative_url }}" alt="{{ site.author.name }}">
  </div>

  <div class="profile-hero__body">
    <h1 class="profile-hero__name">{{ site.author.name }}</h1>
    <div class="profile-hero__meta">
      <span>Imperial College London</span>
      <span><i class="fa fa-map-marker" aria-hidden="true"></i> London, United Kingdom</span>
    </div>
    <p class="profile-hero__tagline">{{ site.description }}</p>

    <div class="profile-hero__links">
      <a href="mailto:{{ site.author.email }}" aria-label="Email" title="Email"><i class="fas fa-envelope" aria-hidden="true"></i></a>
      <a href="{{ site.author.googlescholar }}" aria-label="Google Scholar" title="Google Scholar"><i class="fas fa-graduation-cap" aria-hidden="true"></i></a>
      <a href="https://github.com/{{ site.author.github }}" aria-label="GitHub" title="GitHub"><i class="fab fa-github" aria-hidden="true"></i></a>
      <a href="https://www.linkedin.com/in/{{ site.author.linkedin }}" aria-label="LinkedIn" title="LinkedIn"><i class="fab fa-linkedin" aria-hidden="true"></i></a>
      <a href="https://twitter.com/{{ site.author.twitter }}" aria-label="Twitter" title="Twitter"><i class="fab fa-twitter" aria-hidden="true"></i></a>
    </div>
  </div>
</section>
