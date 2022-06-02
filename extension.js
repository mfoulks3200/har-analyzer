// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

var HARpath;
var docText;
var slow = false;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('har-analyzer is now active');

	
	let analyzeCommand = vscode.commands.registerCommand('har-analyzer.analyze', function () {
		// The code you place here will be executed every time your command is executed

		if(vscode.window.activeTextEditor != null){
			HARpath = vscode.window.activeTextEditor.document.uri;
			docText = vscode.window.activeTextEditor.document.getText();
		}else{
			slow = true;
			vscode.window.showErrorMessage('Large File Detected (>5MB), cannot load due to VS Code limitations.');
			return;
		}

		createWindow(context);
	});

	context.subscriptions.push(analyzeCommand);
}

// this method is called when your extension is deactivated
function deactivate() {}

function createWindow(context){
	var fileName = vscode.window.activeTextEditor.document.fileName.split(/\/|\\/);
	fileName = fileName[fileName.length-1];
	console.log(fileName);
	const panel = vscode.window.createWebviewPanel(
		'viewerWindow', // Identifies the type of the webview. Used internally
		'HAR Analyzer: '+fileName, // Title of the panel displayed to the user
		vscode.ViewColumn.One, // Editor column to show the new webview panel in.
		{ // Enable scripts in the webview
			enableScripts: true, //Set this to true if you want to enable Javascript. 
			retainContextWhenHidden: true
		}
	);
	getWebviewContent(panel, context);
}

function getWebviewContent(panel, context) {
	
	const cssPath = vscode.Uri.joinPath(context.extensionUri, '/media/style.css');
	const cssURI = panel.webview.asWebviewUri(cssPath);
	
	const jqPath = vscode.Uri.joinPath(context.extensionUri, '/media/jquery.min.js');
	const jqUri = panel.webview.asWebviewUri(jqPath);
	
	const scriptPath = vscode.Uri.joinPath(context.extensionUri, '/media/script.js');
	const scriptUri = panel.webview.asWebviewUri(scriptPath);
	
	var p = (context.extensionPath+'/media/analyzer.html').replaceAll("\\", "\/").replaceAll("%20", " ");
	console.log(p);
	const markupPath = vscode.Uri.joinPath(context.extensionUri, 'media/analyzer.html');
	
	const markupUri = panel.webview.asWebviewUri(markupPath);

	const harUri = panel.webview.asWebviewUri(HARpath);

	vscode.workspace.openTextDocument(markupPath).then((document) => {
		let text = document.getText();

		let slowMethod = slow ? `<script>loadHARByURL(\`${harUri}\`);</script>` : "";

		panel.webview.html = `<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<link rel="stylesheet" href="${cssURI}">
				</head>
				<body>
					<script src="${jqUri}"></script>
					<script src="${scriptUri}"></script>
					${text}
					${slowMethod}
				</body>
				</html>`;

		
		panel.webview.onDidReceiveMessage(
			message => {
				if(message.action == "openNewTab"){
					var doc = vscode.workspace.openTextDocument({
						content: message.text
					});
					vscode.window.showTextDocument(doc);
				}
				if(message.action == "loadHAR"){
					panel.webview.postMessage({ command: 'loadHAR', HARText: docText });
				}
			},
			undefined,
			context.subscriptions
			);
	});
  }

module.exports = {
	activate,
	deactivate
}
