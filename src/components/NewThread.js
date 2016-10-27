const GitBook   = require('gitbook-core');
const { React } = GitBook;

const CommentCloser = require('./CommentCloser');
const Toolbar       = require('./Toolbar');
const actions       = require('../actions');

const NewThread = React.createClass({
    propTypes: {
        dispatch:        React.PropTypes.func.isRequired,
        filePath:        React.PropTypes.string.isRequired,
        pageTitle:       React.PropTypes.string.isRequired,
        sectionText:     React.PropTypes.string.isRequired,
        onCloseForm:     React.PropTypes.func.isRequired,
        withCloseButton: React.PropTypes.bool.isRequired
    },

    componentDidMount() {
        this.refs.titleInput.focus();
    },

    getInitialState() {
        return {
            comment:        '',
            displayComment: true
        };
    },

    onCommentChange(e) {
        const comment = e.target.value;
        this.setState({ comment });
    },

    onTitleChange(e) {
        const { comment } = this.state;

        const title = e.target.value;
        if (title.length > 5) {
            this.setState({ displayComment: true });
        }
        else if (!comment.length) {
            this.setState({ displayComment: false });
        }
    },

    render() {
        const { dispatch, pageTitle, filePath,
            sectionText, onCloseForm, withCloseButton } = this.props;
        const { displayComment } = this.state;

        const toolbarActions = [
            {
                text: 'Post',
                onClick: () => {
                    dispatch(actions.postThread(this.refs.titleInput.value, this.refs.commentInput.value, pageTitle, filePath, sectionText))
                    .then(onCloseForm);
                }
            }
        ];

        return (
            <div className="Comment-NewThread">
            {withCloseButton ?
                <CommentCloser onClick={onCloseForm} />
                : null
            }
                <input name="title" ref="titleInput" type="text" defaultValue={pageTitle} placeholder="Start a new discussion" onChange={this.onTitleChange} />
                { displayComment ?
                    <input name="comment" ref="commentInput" type="text" placeholder="Optional comment" onChange={this.onCommentChange} />
                    : null }
                <Toolbar actions={toolbarActions} />
            </div>
        );
    }
});

function mapStateToProps({ page, file }) {
    return {
        filePath:  file.get('path'),
        pageTitle: page.get('title')
    };
}

module.exports = GitBook.connect(NewThread, mapStateToProps);
