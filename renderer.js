import * as monaco from 'monaco-editor';

const openFiles = {};
const tabs = {};
let activeFile = null;
const LANGUAGE_MAP = {
  'js': 'javascript',
  'html': 'html',
  'css': 'css',
  'json': 'json',
  'py': 'python',
  'cpp': 'cpp',
  'c': 'c',
  'java': 'java',
  'ts': 'typescript',
  'md': 'markdown'
};

function getLanguageFromExtension(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  return LANGUAGE_MAP[extension] || 'plaintext';
}

const editor = monaco.editor.create(document.getElementById('editor'), {
  value: '',
  language: 'javascript',
  theme: 'vs-dark',
});

function addTab(fileName) {
  const tabContainer = document.getElementById('tabs');

  const tab = document.createElement('div');
  tab.classList.add('tab');

  const title = document.createElement('span');
  title.textContent = fileName;
  title.setAttribute('data-filename', fileName);
  title.style.marginRight = '8px';
  title.addEventListener('click', (e) => {
    const filename = e.target.getAttribute('data-filename');
    switchTab(filename);
  });

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.border = 'none';
  closeBtn.style.background = 'transparent';
  closeBtn.style.color = 'white';
  closeBtn.style.cursor = 'pointer';

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const filename = e.target.parentNode.querySelector('span').getAttribute('data-filename');
    closeTab(filename);
  });

  tab.appendChild(title);
  tab.appendChild(closeBtn);
  tabContainer.appendChild(tab);
  tabs[fileName] = tab;
}

function closeTab(fileName,) {
  if (!tabs[fileName]) return;

  openFiles[fileName].dispose();
  delete openFiles[fileName];
  tabs[fileName].remove();
  delete tabs[fileName];

  const remaining = Object.keys(openFiles);
  if (remaining.length > 0) {
    switchTab(remaining[0]);
  } else {
    createNewFile();
  }
}

function switchTab(fileName) {
  if (!openFiles[fileName]) return;

  activeFile = fileName;
  editor.setModel(openFiles[fileName]);

  Object.values(tabs).forEach(tab => {
    const tabFileName = tab.querySelector('span').getAttribute('data-filename');
    tab.classList.toggle('active-tab', tabFileName === fileName);
  });
}

async function openFile() {
  const fileData = await window.api.openFile();

  if (!fileData || !fileData.content) return;

  const fileName = fileData.name || `File ${Object.keys(openFiles).length + 1}`;
  const language = getLanguageFromExtension(fileName);

  if (openFiles[fileName]) {
    switchTab(fileName);
    return;
  }
  const model = monaco.editor.createModel(fileData.content, language);
  openFiles[fileName] = model;

  addTab(fileName);
  switchTab(fileName);

}
document.getElementById('open-btn').addEventListener('click', openFile);



async function saveFile() {
  if (!activeFile) return alert('No file is open');

  const content = openFiles[activeFile].getValue();
  const isUntitled = activeFile.startsWith('untitled');

  try {
    const savedPath = await window.api.saveFile(isUntitled ? null : activeFile, content);
    if (savedPath) {
      // alert(`File saved: ${savedPath}`);

      if (isUntitled) {
        const oldFileName = activeFile;

        const newFileName = savedPath.split(/[\\/]/).pop() || 'Untitled';
        const newLanguage = getLanguageFromExtension(newFileName);

        const model = openFiles[oldFileName];
        monaco.editor.setModelLanguage(model, newLanguage);

        openFiles[newFileName] = openFiles[oldFileName];
        delete openFiles[oldFileName];

        const tab = tabs[oldFileName];
        if (tab) {
          const titleSpan = tab.querySelector('span');
          titleSpan.textContent = newFileName;
          titleSpan.setAttribute('data-filename', newFileName);

          tabs[newFileName] = tab;
          delete tabs[oldFileName];
        }
        activeFile = newFileName;
        switchTab(newFileName);
        editor.focus();
      }
      // alert(`File saved successfully: ${savedPath}`);
    }
  } catch (error) {
    console.error('Error saving file:', error);
    alert('Failed to save the file.');
  }
}
document.getElementById('save-btn').addEventListener('click', saveFile);


function createNewFile() {
  let fileIndex = 1;
  let fileName = `untitled-${fileIndex}`;

  while (openFiles[fileName]) {
    fileIndex++;
    fileName = `untitled-${fileIndex}`;
  }

  const model = monaco.editor.createModel("", "plaintext");
  openFiles[fileName] = model;

  addTab(fileName);
  switchTab(fileName);
}
document.addEventListener('DOMContentLoaded', createNewFile);
document.getElementById('new-btn').addEventListener('click',createNewFile);


document.addEventListener('keydown', (event) => {
  if (event.ctrlKey) {
    event.preventDefault();

    switch (event.key.toLowerCase()) {
      case 's':
        saveFile();
        break;

      case 'o':
        openFile();
        break;

      case 'n':
        createNewFile();
        break;
      case 'f5':
        runCode();
        break;
    }
  }
});


async function runCode() {
  if (!activeFile) return alert('No file is open to run');

  const code = openFiles[activeFile].getValue();
  const language = getLanguageFromExtension(activeFile);

  // const supportedLanguages = ['c', 'python'];

  // if (!supportedLanguages.includes(language)) {
  //   return alert(`Only ${supportedLanguages.join(', ')} are supported`);
  // }

  try {
    const result = await window.api.runCode(code, language);

    const outputElement = document.getElementById('output');
    if (!outputElement) {
      console.log('Error: #output element not found!');
      return;
    }
    outputElement.innerText = result.error ? `Error: ${result.error}` : result.output;

  } catch (error) {
    console.error('Execution error:', error);
    document.getElementById('output').textContent = 'Failed to run code.';
  }
}

document.getElementById('run-btn').addEventListener('click', runCode);