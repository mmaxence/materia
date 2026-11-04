// Set the public repository URL here when Materia is pushed to GitHub.
const githubUrl = "https://github.com/mmaxence/materia";
if (githubUrl) {
  for (const link of document.querySelectorAll("[data-github]")) {
    link.href = githubUrl;
    link.removeAttribute("aria-disabled");
    link.removeAttribute("title");
    link.textContent = "GitHub ↗";
  }
}
