var SITE = {
  user: "abdullah",
  hostname: "itsabdullah.dev",
  home: "/home/abdullah",

  identity: "Abdullah. MIT CS + Math graduate. R&D engineer at Siemens EDA working on solver performance and design verification.",

  fs: {
    "resume.pdf": { url: "/assets/Resume.pdf", content: "Resume \u2014 Abdullah (PDF)" },
    "projects": {
      children: {
        "u2f-security-key": { url: "https://github.com/itstorque/u2f", content: "FIDO U2F hardware security key." },
        "onechan": { url: "https://github.com/abdullah8a0/one-chan", content: "FPGA chess engine with a custom accelerator." },
        "profemon": { url: "https://github.com/abdullah8a0/profemon", content: "ESP32 in-person PvP game system." }
      }
    },
    "links": {
      children: {
        "email": { url: "mailto:abdullah8a0@gmail.com", content: "abdullah8a0@gmail.com" },
        "github": { url: "https://github.com/abdullah8a0/", content: "https://github.com/abdullah8a0/" },
        "linkedin": { url: "https://www.linkedin.com/in/abdula1/", content: "https://www.linkedin.com/in/abdula1/" }
      }
    }
  },

  shortcuts: {
    resume: "resume.pdf",
    email: "links/email",
    github: "links/github",
    linkedin: "links/linkedin"
  },

  theme: "brutalist",

  themes: ["default", "tty", "crt", "brutalist", "float"],

  themeLabels: {
    default: "macOS",
    tty: "TTY",
    crt: "CRT",
    brutalist: "Brutal",
    float: "Float"
  },

  intro: {
    staleAfter: 1000 // 1s for testing, use 3600000 for 1 hour
  }
};
