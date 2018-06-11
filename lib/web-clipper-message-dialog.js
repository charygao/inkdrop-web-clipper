'use babel';

import { React, CompositeDisposable, html2markdown } from 'inkdrop';
import Readability from './Readability';
const { Note } = inkdrop.models;

export default class WebClipperMessageDialog extends React.Component {
  constructor(props) {
    super(props);

    // Events subscribed to in Inkdrop's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this dialog
    this.subscription = inkdrop.commands.add(document.body, {
      'web-clipper:clip-page': () => this.handleClipPageCommand()
    });

    this.state = {
      urlToClip: '',
      destBookId: null,
      formErrorMessage: null
    }
  }

  componentWillUnmount() {
    this.subscriptions.dispose();
  }

  renderFormError() {
    if (this.state.formErrorMessage) {
      return (
        <div className='ui negative message'>
          <p>
            {this.state.formErrorMessage}
          </p>
        </div>
      )
    }
  }

  render() {
    const { MessageDialog, BookDropdownList } = inkdrop.components.classes;
    const buttons = [{
      label: 'Cancel'
    }, {
      label: 'Clip',
      primary: true
      // FIXME: allow submit using Enter
    }];

    return (
      <MessageDialog
        ref='dialog'
        title='Markdown Web Clipper'
        buttons={buttons}
        onDismiss={this.handleDismissDialog.bind(this)}
      >
        <div className='ui form'>
          {this.renderFormError()}
          <div className='field'>
            <BookDropdownList
              onChange={this.handleChangeBook.bind(this)}
              selectedBookId={this.state.destBookId}
              placeholder='Select Destination Notebook...'
            />
          </div>
          <div className='field'>
            <input
              type="text"
              value={this.state.urlToClip}
              onChange={this.handleChangeUrl.bind(this)}
              placeholder="Type or paste a URL"
            />
          </div>
        </div>
      </MessageDialog >
    )
  }

  handleChangeBook(bookId) {
    this.setState({
      destBookId: bookId
    })
  }

  handleChangeUrl(e) {
    this.setState({
      urlToClip: e.target.value
    })
  }

  handleDismissDialog(dialog, buttonIndex) {
    if (buttonIndex === 1) {
      const { destBookId, urlToClip } = this.state
      this.setState({ formErrorMessage: null });

      if (!destBookId) {
        this.setState({ formErrorMessage: 'Please select the destination notebook.' });
        return false;
      }

      // Check if the URL is valid
      try {
        new URL(urlToClip);
      } catch (err) {
        console.warn('Web Clipper: invalid URL ' + urlToClip);
        this.setState({ formErrorMessage: 'Please provide a valid URL.' });
        return false;
      }

      // Get the page HTML using Fetch
      fetch(urlToClip)
        .then(res => res.text())
        .then(text => {
          // Construct a DOM with the page contents
          const dom = new DOMParser().parseFromString(text, 'text/html');

          // Strip the page to just the article contents using Readability
          // TODO: find and convert relative links to absolute links
          const article = new Readability(dom).parse();

          // Convert the article HTML to Markdown
          let markdown = (0, html2markdown)(article.content);

          // Insert the source and date at the bottom
          markdown = `${markdown}

---

Clipped from [${new URL(urlToClip).host}](${urlToClip}) on ${new Date().toLocaleDateString()}
`

          const note = new Note({
            title: article.title,
            body: markdown,
            bookId: destBookId
          });

          note.save()
            .then(doc => {
              // Open the newly created note
              const editorActions = inkdrop.flux.getActions('editor');
              editorActions.open({
                noteId: doc.id,
                isNew: true
              }).then(() => {
                const { dialog } = this.refs;
                dialog.dismissDialog();
              });
            });
        })
        .catch(err => {
          console.warn('Web Clipper: couldn\'t fetch URL ' + urlToClip);
          this.setState({ formErrorMessage: 'Couldn\'t clip this URL.' });
        });

      return false;
    }
  }

  handleClipPageCommand() {
    const { dialog } = this.refs;
    if (!dialog.isShown) {
      this.setState({
        urlToClip: '',
        destBookId: null,
        formErrorMessage: null
      });
      dialog.showDialog();
    }
  }
}
