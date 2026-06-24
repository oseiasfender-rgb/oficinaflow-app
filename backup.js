/*
OficinaOS V549.00 — Backup Global
Depende de core.js.
*/

(function(){
  "use strict";

  function exportSystem(){
    if(!window.OficinaOSCore) throw new Error("core.js não carregado.");
    window.OficinaOSCore.exportJSON();
  }

  async function importSystem(file){
    if(!window.OficinaOSCore) throw new Error("core.js não carregado.");
    if(!file) throw new Error("Nenhum arquivo informado.");
    return await window.OficinaOSCore.importJSON(file);
  }

  function attachBackupButtons(){
    const exportBtn = document.querySelector("[data-oficinaos-export]");
    const importInput = document.querySelector("[data-oficinaos-import]");
    if(exportBtn) exportBtn.addEventListener("click", exportSystem);
    if(importInput) importInput.addEventListener("change", e=>{
      const file = e.target.files && e.target.files[0];
      if(file) importSystem(file).then(()=>location.reload()).catch(alert);
    });
  }

  window.OficinaOSBackup = {
    exportSystem,
    importSystem,
    attachBackupButtons
  };

  document.addEventListener("DOMContentLoaded", attachBackupButtons);
})();
