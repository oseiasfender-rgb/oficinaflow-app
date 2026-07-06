
(function(g){
'use strict';
const VERSION='551.39';
function now(){return new Date().toISOString()}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}
function st(){return g.StateManager?g.StateManager.load():(g.STATE=g.STATE||{})}
function sv(s){if(g.StateManager&&g.StateManager.save)return g.StateManager.save(s);g.STATE=s;try{localStorage.setItem('OficinaOS',JSON.stringify(s))}catch(e){}return s}
function ensure(){let s=st();s.version=VERSION;s.releaseStage='GITHUB_START_FINAL';s.githubStart=obj(s.githubStart);s.githubStart.version=VERSION;s.githubStart.ready=true;s.githubStart.generatedAt=s.githubStart.generatedAt||now();s.updatedAt=now();sv(s);return s}
function readiness(){ensure();const checks=[
{name:'StorageAdapter / IndexedDB',pass:!!g.StorageAdapter},
{name:'CleanStart',pass:!!g.CleanStart},
{name:'AutoSaveSmartBackup',pass:!!g.AutoSaveSmartBackup},
{name:'FirstRunWizard',pass:!!g.FirstRunWizard},
{name:'BrowserRuntimeQA',pass:!!g.BrowserRuntimeQA},
{name:'PDFPremiumQA',pass:!!g.PDFPremiumQA},
{name:'IAConsultor',pass:!!g.IAConsultor},
{name:'AdminShell',pass:!!g.AdminShell},
{name:'TabFusionExcellence',pass:!!g.TabFusionExcellence},
{name:'ProductionDist',pass:!!g.ProductionDist}
];const failed=checks.filter(c=>!c.pass);return{version:VERSION,status:failed.length?'ATENCAO':'PRONTO_PARA_INICIAR',generatedAt:now(),checks,failed,firstRun:'wizard/index.html',qa:'qa/index.html',pdf:'pdf/index.html',ia:'ia/consultor.html',admin:'admin/index.html'}}
function firstSteps(){return['Subir todo o conteúdo deste pacote na raiz do GitHub Pages','Ativar GitHub Pages na branch principal e pasta raiz','Abrir wizard/index.html','Verificar IndexedDB','Começar do zero ou importar backup real','Configurar empresa','Gerar primeiro backup','Abrir qa/index.html e rodar BrowserRuntimeQA.run()','Abrir pdf/index.html e validar PDF premium','Abrir ia/consultor.html para manual','Cadastrar primeiro cliente, veículo e orçamento reais','Exportar backup JSON']}
function boot(){ensure()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
g.GitHubStartFinal={version:VERSION,ensure,readiness,firstSteps};
})(window);
