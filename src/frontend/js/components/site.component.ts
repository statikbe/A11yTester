export class SiteComponent {
  constructor() {
    const copyButtons = document.querySelectorAll(".js-copy-selector");
    if (copyButtons) {
      Array.from(copyButtons).forEach((button: HTMLElement) => {
        this.initCopyButton(button);
      });
    }
  }

  private initCopyButton(button: HTMLElement) {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const target = button.parentElement.querySelector("pre") as HTMLElement;
      const text = target.innerText;
      navigator.clipboard.writeText(text).then(() => {
        button.classList.add("copied");
        setTimeout(() => {
          button.classList.remove("copied");
        }, 2000);
      });
    });
  }
}
