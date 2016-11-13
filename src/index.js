import React from 'react';
import ReactDOM from 'react-dom';
import {
  Editor, EditorState, RichUtils, Entity,
  Modifier, CompositeDecorator, convertToRaw
} from 'draft-js';

const compositeDecorator = new CompositeDecorator([
  {
    strategy: handleStrategy,
    component: HandleSpan,
  },
  {
    strategy: hashtagStrategy,
    component: HashtagSpan,
  },
]);

// Note: these aren't very good regexes, don't use them!
const HANDLE_REGEX = /\@[\w]+/g;
const HASHTAG_REGEX = /\#[\w\u0590-\u05ff]+/g;

function handleStrategy(contentBlock, callback) {
  findWithRegex(HANDLE_REGEX, contentBlock, callback);
}

function hashtagStrategy(contentBlock, callback) {
  findWithRegex(HASHTAG_REGEX, contentBlock, callback);
}

function findWithRegex(regex, contentBlock, callback) {
  const text = contentBlock.getText();
  let matchArr, start;
  while ((matchArr = regex.exec(text)) !== null) {
    start = matchArr.index;
    callback(start, start + matchArr[0].length);
  }
}

const HandleSpan = (props) => {
  return <span {...props} style={styles.handle}>{props.children}</span>;
};

const HashtagSpan = (props) => {
  return <span {...props} style={styles.hashtag}>{props.children}</span>;
};

class MyEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editorState: EditorState.createEmpty(),
      isLinkInputShowed: false
    };
  }

  handleChange(editorState) {
    console.log(editorState.toJS())
    this.setState({ editorState });
  }

  handleKeyCommand(command) {
    console.log(command)
    const newState = RichUtils.handleKeyCommand(this.state.editorState, command);

    if (newState) {
      this.handleChange(newState);
      return 'handled';
    }

    return 'not-handled';
  }

  handleBoldClick() {
    const { editorState } = this.state

    this.handleChange(RichUtils.toggleInlineStyle(this.state.editorState, 'BOLD'));
  }

  logState() {
    const content = this.state.editorState.getCurrentContent();
    console.log(content);
    console.log(convertToRaw(content));
  }

  promptForLink() {
    const { editorState } = this.state;
    const selection = editorState.getSelection();
    console.log(selection.toJS());
    console.log(selection.isCollapsed());

    // 保证确实有选中的区域
    if (!selection.isCollapsed()) {
      const contentState = editorState.getCurrentContent();

      // 当前的 anchor 所在的 block 的 key(anchorKey)
      const startKey = selection.getStartKey();
      const startOffset = selection.getStartOffset();

      const linkStartBlock = contentState.getBlockForKey(startKey);
      const linkKey = linkStartBlock.getEntityAt(startOffset);

      let url = ''
      if (linkKey) {
        const linkInstance = editorState.getEntity(linkKey);
        url = linkInstance.getData().url;
      }
      
      this.setState({
        isLinkInputShowed: true
      })
    }
  }

  confirmLink() {
    this.setState({
      isLinkInputShowed: false
    })
  }

  render() {
    const {
      isLinkInputShowed
    } = this.state

    return (
      <div>
        <button onClick={this.handleBoldClick.bind(this)}>Bold</button>
        <button onClick={this.promptForLink.bind(this)}>Link</button>
        {isLinkInputShowed && (
        <div>
          <input />
          <button onClick={this.confirmLink.bind(this)}>OK</button>
        </div>
        )}
        <Editor
          editorState={this.state.editorState}
          handleKeyCommand={this.handleKeyCommand.bind(this)}
          onChange={this.handleChange.bind(this)}
        />
        <button onClick={this.logState.bind(this)}>Log State</button>
      </div>
    );
  }
}

ReactDOM.render(
  <MyEditor />,
  document.getElementById('container')
);
