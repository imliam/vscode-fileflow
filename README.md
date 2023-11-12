# File Flow for VSCode

<p align="center">
  <img src="https://raw.githubusercontent.com/imliam/vscode-fileflow/master/icon.png" alt="File Flow for VSCode">
</p>

<p align="center">
An extension for Visual Studio Code that lets you quickly flow between files, allowing you to make smooth coding presentations.
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/imliam/vscode-fileflow/master/commands.png" alt="Commands supplied by File Flow">
</p>

File Flow is designed to make it easier to give presentations within VSCode itself. You can prepare some files and seamlessly transition through them from one to the next with a quick key press.

Think of it like very simple slideshows for VSCode.

### Commands

The primary functionality of File Flow lies in the "Go to Next File" command (think of this as going to the next slide). This command will find the next file in your current directory and open it in the editor window.

| Command                                                | Description                                                       |
| ------------------------------------------------------ | ----------------------------------------------------------------- |
| Go to Next File<br>`fileFlow.goToNextFile`             | Open the next file in the current directory                       |
| Go to Previous File<br>`fileFlow.goToPreviousFile`     | Open the previous file in the current directory                   |
| Go to Next Folder<br>`fileFlow.goToNextFolder`         | Open the first file in the next folder of the parent directory    |
| Go to Previous Folder<br>`fileFlow.goToPreviousFolder` | Open the last file in the previous folder of the parent directory |
| Go to First File<br>`fileFlow.goToFirstFile`           | Open the first file in the current directory                      |
| Go to Last File<br>`fileFlow.goToLastFile`             | Open the last file in the current directory                       |

> ℹ️ Try binding the `goToNextFile` and `goToPreviousFile` commands to keyboard shortcuts to make presenting your code smoother!

### Out of Bounds

What happens when you're on the last file in a directory and you try to go to the next file? Or if you're on the first file and you try to go back? There are some settings to decide how you want to handle this:

- `fileFlow.none` will not do anything, keeping the current file in view
- `fileFlow.loopCurrentFolder` will go back to the first or last file in the current directory
- `fileFlow.goToNextFolder` will automatically find the first file in the next subdirectory of the parent directory
  - You might want to use this if you have multiple "chapters" of a presentation and want to separate them but still be able to transition smoothly from one to the next
  - Check the [examples/subfolders](https://github.com/imliam/vscode-inline-parameters/tree/master/examples/subfolders) directory to see how this might work

### Previews

By default, VSCode will display the selected file in the regular code editor, but if you change the `fileFlow.previewFiles` setting from `none` to `all` or `custom`, File Flow will automatically open them in preview mode.

> ℹ️ If you set this option to `custom`, File Flow will only try to preview the specific file extensions you choose in the `fileFlow.previewCustomFileExtensions` setting. By default, this includes `.md` and `.html` files.

This means you can have beautiful markdown or HTML files rendered inline, allowing you to have great title slides without limitations.

<p align="center">
  <img src="https://raw.githubusercontent.com/imliam/vscode-fileflow/master/html-preview.png" alt="It even supports HTML!">
</p>

Write some CSS inline, or pull in a CSS library to make it work; the only limit is HTML!

## Credits / Links

- [Liam Hammett](https://github.com/imliam)
- [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see the [license file](LICENSE.md) for more information.
