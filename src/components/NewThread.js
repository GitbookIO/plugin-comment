const GitBook   = require('gitbook-core');
const { React } = GitBook;

const Toolbar = require('./Toolbar');
const actions = require('../actions');

const NewThread = React.createClass({
    propTypes: {
        dispatch:    React.PropTypes.func.isRequired,
        filePath:    React.PropTypes.string.isRequired,
        pageTitle:   React.PropTypes.string.isRequired,
        sectionText: React.PropTypes.string.isRequired
    },

    componentDidMount() {
        this.refs.commentInput.focus();
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
        const { dispatch, pageTitle, filePath, sectionText } = this.props;
        const { displayComment } = this.state;

        const toolbarActions = [
            {
                text: 'Post',
                onClick: () => {
                    dispatch(actions.postThread(this.refs.titleInput.value, this.refs.commentInput.value, pageTitle, filePath, sectionText));
                }
            }
        ];

        return (
            <div className="Comment-NewThread">
                <input ref="titleInput" type="text" value={pageTitle} placeholder="Start a new discussion" onChange={this.onTitleChange} />
                { displayComment ?
                    <input ref="commentInput" type="text" placeholder="Optional comment" onChange={this.onCommentChange} />
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
