const GitBook   = require('gitbook-core');
const { React } = GitBook;
const { List } = GitBook.Immutable;

const Toolbar = require('./Toolbar');
const actions = require('../actions');

const Comments = React.createClass({
    propTypes: {
        comments: React.PropTypes.array
    },

    render() {
        return (
            <div className="Comment-CommentsList">

            </div>
        );
    }
});

const Comment = React.createClass({
    propTypes: {
        comment: React.PropTypes.object.isRequired
    },

    createBody() {
        const { comment } = this.props;
        return {
            __html: comment.body
        };
    },

    render() {
        const { comment } = this.props;

        let title = null;
        if (Boolean(comment.title)) {
            title = <h6>{comment.title}</h6>;
        }

        let body = null;
        if (Boolean(comment.body)) {
            body = <div dangerouslySetInnerHTML={this.createBody()} />;
        }

        return (
            <div className="Comment-Comment">
                <img className="Comment-UserAvatar" src={comment.user.urls.avatar} />
                <div className="Comment-CommentBody">
                    <a className="Comment-CommentUser" href={comment.user.urls.profile} target="_blank">{comment.user.name}</a>
                    <div className="Comment-CommentContent">
                        {title}
                        {body}
                    </div>
                </div>
            </div>
        );
    }
});

const ThreadComments = React.createClass({
    propTypes: {
        dispatch: React.PropTypes.func.isRequired,
        thread:   React.PropTypes.object.isRequired,
        comments: React.PropTypes.array
    },

    componentDidMount() {
        const { dispatch, thread } = this.props;
        dispatch(actions.fetchComments(thread.number.toString()));
    },

    render() {
        const { dispatch, thread, comments } = this.props;

        const toolbarActions = [
            {
                text: 'Comment',
                onClick: () => {}
            },
            {
                text: 'Close',
                onClick: () => {
                    dispatch(actions.closeThread(thread.number));
                }
            },
            {
                text: 'New Thread',
                onClick: () => {}
            }
        ];

        return (
            <div>
                <Comment comment={thread} />
                <Comments comments={comments} />
                <Toolbar actions={toolbarActions} />
            </div>
        );
    }
});

function mapStateToProps({ comment, config, page }, props) {
    const { thread } = props;

    return {
        comments: (comment.get('comments').get(thread.number.toString()) || new List()).toJS()
    };
}

module.exports = GitBook.connect(ThreadComments, mapStateToProps);
