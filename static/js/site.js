var SITE = {
  user: "abdullah",
  hostname: "fixpoint.cc",
  home: "/home/abdullah",

  identity: "Abdullah. MIT CS + Math, MEng in progress. MEng student at MIT CSAIL (MATCHA Lab), working on formal verification of out-of-order RISC-V. Previously: R&D at Siemens EDA.",

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

  intro: {
    staleAfter: 600000 // 10 minutes
  }
};
