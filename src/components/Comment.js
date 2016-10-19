require('whatwg-fetch');
const GitBook    = require('gitbook-core');
const { React }  = GitBook;
const classNames = require('classnames');
const uuid       = require('uuid');
const actions    = require('../actions');

const Comment = React.createClass({
    propTypes: {
        comment: React.PropTypes.object.isRequired
    },

    render() {
        const { comment } = this.props;

        return (
            <div className="Comment-Comment">
                <img className="Comment-UserAvatar" src={comment.user.urls.avatar} />
                <div className="Comment-CommentBody">
                    <a className="Comment-CommentUser" href={comment.user.urls.profile} target="_blank">{comment.user.name}</a>
                    <div className="Comment-CommentContent">

                    </div>
                </div>
            </div>
        );
    }
});

const Thread = React.createClass({
    propTypes: {
        thread: React.PropTypes.object.isRequired
    },

    render() {
        const { thread } = this.props;
        return (
            <div className="Comment-Thread">
                <div className="Comment-ThreadTitle">
                    {thread.title}
                </div>
                <div className="Comment-ThreadUser">
                    {`#${thread.number} posted by ${thread.user.name}`}
                </div>
            </div>
        );
    }
});

const ThreadsList = React.createClass({
    propTypes: {
        threads: React.PropTypes.array.isRequired
    },

    render() {
        const { threads } = this.props;
        return (
            <div className="Comment-ThreadsList">
                { threads.map((thread, i) => <Thread key={i} thread={thread} />) }
            </div>
        );
    }
});

const Toolbar = React.createClass({
    propTypes: {
        actions: React.PropTypes.array
    },

    render() {
        const toolbarActions = this.props.actions;
        return (
            <div className="Comment-Toolbar">
                { toolbarActions.map((action, i) => <a key={i} href="#" onClick={action.onClick}>{action.text}</a>)}
            </div>
        );
    }
});

const NewThread = React.createClass({
    propTypes: {

    },

    getInitialState() {
        return {
            comment:        '',
            displayComment: false
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
        // const {  } = this.props;
        const { displayComment } = this.state;

        const toolbarActions = [
            {
                text: 'Post',
                onClick: (e) => {
                    e.preventDefault();
                }
            }
        ];

        return (
            <div className="Comment-NewThread">
                <input type="text" placeholder="Start a new discussion" onChange={this.onTitleChange} />
                { displayComment ?
                    <input type="text" placeholder="Optional comment" onChange={this.onCommentChange} />
                    : null }
                <Toolbar actions={toolbarActions} />
            </div>
        );
    }
});

const CommentsArea = React.createClass({
    propTypes: {
        threads: React.PropTypes.array.isRequired
    },

    render() {
        const { threads } = this.props;
        const inner = threads.length > 1 ?
            <ThreadsList threads={threads} /> :
            <NewThread />;

        return (
            <div className="Comment-CommentsArea">
                {inner}
            </div>
        );
    }
});

const Marker = React.createClass({
    propTypes: {
        nbComments: React.PropTypes.number.isRequired,
        onClick:    React.PropTypes.func.isRequired
    },

    render() {
        const { nbComments, onClick } = this.props;
        return (
            <div className="Comment-Icon" onClick={onClick}>
                <div className="Comment-Marker">
                    { nbComments > 0 ? nbComments : '+' }
                </div>
            </div>
        );
    }
});

const CommentSection = React.createClass({
    propTypes: {
        children:           React.PropTypes.node.isRequired,
        dispatch:           React.PropTypes.func.isRequired,
        threads:            React.PropTypes.array.isRequired,
        nbComments:         React.PropTypes.number.isRequired,
        openArea:           React.PropTypes.string,
        highlightCommented: React.PropTypes.bool.isRequired
    },

    componentDidMount() {
        if (typeof window != 'undefined') {
            this.uniqueId = uuid.v4();
        }
    },

    toggleArea() {
        const { dispatch, openArea } = this.props;

        if (this.uniqueId != openArea) {
            dispatch(actions.openArea(this.uniqueId));
        }
        else {
            dispatch(actions.closeArea());
        }
    },

    render() {
        const { children, threads, nbComments,
            openArea, highlightCommented } = this.props;
        const isOpen = this.uniqueId == openArea;

        const className = classNames('Comment-Section', {
            'Comment-HasComments': nbComments > 0,
            'Comment-Highlight':   highlightCommented,
            'Comment-OpenArea':    isOpen
        });

        return (
            <div className={className}>
                { children }
                { isOpen ?
                    <CommentsArea threads={threads} />
                    : null }
                <Marker nbComments={nbComments} onClick={this.toggleArea} />
            </div>
        );
    }
});

/**
 * Get children as text
 * @param {React.Children} children
 * @return {String}
 */
function getChildrenToText(children) {
    return React.Children.map(children, child => {
        if (typeof child === 'string') {
            return child;
        } else {
            return child.props.children ?
                getChildrenToText(child.props.children) : '';
        }
    }).join('');
}

function mapStateToProps({ comment, config }, props) {
    let threads    = comment.get('threads').toJS();
    let nbComments = 0;

    // Return only threads corresponding to content
    const { children } = props;

    const text  = getChildrenToText(children);
    const words = text.split(' ');

    threads = threads.filter((thread) => {
        // Compute matching for threads
        const threadWords = (thread.context.section || '').split(' ');

        const commonWordsWithSection = threadWords.filter((word) => {
            return words.includes(word);
        });
        const commonWordsFromSection = words.filter((word) => {
            return threadWords.includes(word);
        });

        const matching = (
            (commonWordsWithSection.length / threadWords.length)
            + (commonWordsFromSection.length / words.length)
        ) / 2;

        if (matching > 0.8) {
            nbComments += thread.comments + 1;
            return true;
        }
        else {
            return false;
        }
    });

    return {
        threads,
        nbComments,
        openArea: comment.get('openArea'),
        highlightCommented: config.getIn([ 'pluginsConfig', 'comment', 'highlightCommented' ], true)
    };
}

module.exports = GitBook.connect(CommentSection, mapStateToProps);
