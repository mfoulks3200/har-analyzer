// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

var HARpath;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "har-analyzer" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('har-analyzer.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from HAR Analyzer!');
	});

	context.subscriptions.push(disposable);

	
	let analyzeCommand = vscode.commands.registerCommand('har-analyzer.analyze', function () {
		// The code you place here will be executed every time your command is executed

		HARpath = vscode.window.activeTextEditor.document.uri;

		createWindow(context);
	});

	context.subscriptions.push(analyzeCommand);
}

// this method is called when your extension is deactivated
function deactivate() {}

function createWindow(context){
	const panel = vscode.window.createWebviewPanel(
		'viewerWindow', // Identifies the type of the webview. Used internally
		'HAR Analyzer', // Title of the panel displayed to the user
		vscode.ViewColumn.One, // Editor column to show the new webview panel in.
		{ // Enable scripts in the webview
			enableScripts: true //Set this to true if you want to enable Javascript. 
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
					<script>
						loadHARByURL(\`${harUri}\`);
					</script>
				</body>
				</html>`;
	});
  }

module.exports = {
	activate,
	deactivate
}
