// ==UserScript==
// @name         Lyra Exporter Fetch (One-Click AI Chat Backup)
// @name:zh-CN 支持Claude、ChatGPT、Grok、Copilot、Gemini、NotebookLM等多平台的全功能AI对话跨分支全局搜索文档PDF长截图导出管理工具
// @name:zh-TW   Lyra Exporter Fetch (一鍵 AI 對話備份)
// @name:ja      Lyra Exporter Fetch (ワンクリック AI チャットバックアップ)
// @name:ko      Lyra Exporter Fetch (원클릭 AI 채팅 백업)
// @name:es      Lyra Exporter Fetch (Backup de Chat AI con Un Clic)
// @name:pt      Lyra Exporter Fetch (Backup de Chat AI com Um Clique)
// @name:fr      Lyra Exporter Fetch (Sauvegarde de Chat AI en Un Clic)
// @name:de      Lyra Exporter Fetch (Ein-Klick AI-Chat-Backup)
// @description One-click export for Claude, ChatGPT, Grok, Copilot, Gemini , Google AI Studio & NotebookLM. Backups all chat branches, artifacts, and attachments. Exports to JSON/Markdown/PDF/Editable Screenshots. The ultimate companion for Lyra Exporter to build your local AI knowledge base.
// @description:zh-CN  一键导出 Claude/ChatGPT/Gemini/Grok/Copilot/Google AI Studio/NotebookLM 对话记录（支持分支、PDF、长截图）。保留完整对话分支、附加图片、LaTeX 公式、Artifacts、附件与思考过程。Lyra Exporter 的最佳搭档，打造您的本地 AI 知识库。
// @description:zh-TW 一鍵匯出 Claude、ChatGPT、Grok、Copilot、Gemini、Google AI Studio 和 NotebookLM 的對話。備份所有聊天分支、Artifacts 和附件。匯出為 JSON/Markdown/PDF/可編輯截圖。Lyra Exporter 的終極配套工具，用於建構本地 AI 知識庫。
// @description:ja Claude、ChatGPT、Grok、Copilot、Gemini、Google AI Studio、NotebookLM のワンクリックエクスポート。すべてのチャットブランチ、アーティファクト、添付ファイルをバックアップ。JSON/Markdown/PDF/編集可能なスクリーンショットにエクスポート。ローカル AI ナレッジベース構築のための Lyra Exporter の究極のコンパニオン。
// @description:ko Claude, ChatGPT, Grok, Copilot, Gemini, Google AI Studio 및 NotebookLM 원클릭 내보내기. 모든 채팅 브랜치, 아티팩트 및 첨부 파일 백업. JSON/Markdown/PDF/편집 가능한 스크린샷으로 내보내기. 로컬 AI 지식 베이스 구축을 위한 Lyra Exporter의 궁극적인 동반자.
// @description:es Exportación con un clic para Claude, ChatGPT, Grok, Copilot, Gemini, Google AI Studio y NotebookLM. Respalda todas las ramas de chat, artefactos y adjuntos. Exporta a JSON/Markdown/PDF/Capturas editables. El compañero definitivo de Lyra Exporter para construir tu base de conocimiento de IA local.
// @description:pt Exportação com um clique para Claude, ChatGPT, Grok, Copilot, Gemini, Google AI Studio e NotebookLM. Faz backup de todas as ramificações de chat, artefatos e anexos. Exporta para JSON/Markdown/PDF/Capturas editáveis. O companheiro definitivo do Lyra Exporter para construir sua base de conhecimento de IA local.
// @description:fr Exportation en un clic pour Claude, ChatGPT, Grok, Copilot, Gemini, Google AI Studio et NotebookLM. Sauvegarde toutes les branches de chat, artefacts et pièces jointes. Exporte vers JSON/Markdown/PDF/Captures modifiables. Le compagnon ultime de Lyra Exporter pour construire votre base de connaissances IA locale.
// @description:de Ein-Klick-Export für Claude, ChatGPT, Grok, Copilot, Gemini, Google AI Studio und NotebookLM. Sichert alle Chat-Branches, Artefakte und Anhänge. Exportiert nach JSON/Markdown/PDF/Bearbeitbare Screenshots. Der ultimative Begleiter für Lyra Exporter zum Aufbau Ihrer lokalen AI-Wissensdatenbank.
// @namespace    userscript://lyra-conversation-exporter
// @version      8.1
// @homepage     https://github.com/Yalums/lyra-exporter/
// @supportURL   https://github.com/Yalums/lyra-exporter/issues
// @author       Yalums, Amir Harati, AlexMercer, Youkies
// @match        https://claude.easychat.top/*
// @match        https://pro.easychat.top/*
// @match        https://claude.ai/*
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://grok.com/*
// @match        https://x.com/i/grok*
// @match        https://copilot.microsoft.com/*
// @match        https://www.bing.com/*
// @match        https://bing.com/*
// @match        https://gemini.google.com/app/*
// @match        https://notebooklm.google.com/*
// @match        https://aistudio.google.com/*
// @include      *://gemini.google.com/*
// @include      *://notebooklm.google.com/*
// @include      *://aistudio.google.com/*
// @connect      googleusercontent.com
// @connect      lh3.googleusercontent.com
// @connect      assets.grok.com
// @connect      copilot.microsoft.com
// @connect      bing.com
// @connect      r.bing.com
// @connect      edgeservices.bing.com
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/fflate@0.7.4/umd/index.js
// @license      GNU General Public License v3.0
// @downloadURL https://update.greasyfork.org/scripts/539579/Lyra%20Exporter%20Fetch%20%28One-Click%20AI%20Chat%20Backup%29.user.js
// @updateURL https://update.greasyfork.org/scripts/539579/Lyra%20Exporter%20Fetch%20%28One-Click%20AI%20Chat%20Backup%29.meta.js
