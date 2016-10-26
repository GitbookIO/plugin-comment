require('whatwg-fetch');
const GitBook    = require('gitbook-core');
const { React }  = GitBook;
const classNames = require('classnames');

const CommentsArea = require('./CommentsArea');
const actions      = require('../actions');

// Unique Id for CommentSection components
let uniqueId = 0;

/**
 * Return number of comments given an array of threads
 * @param  {Array<Thread>} threads
 * @return {Number}
 */
function getNbComments(threads) {
    return threads.reduce((total, thread) => {
        return total + thread.comments + 1;
    }, 0);
}

const Marker = React.createClass({
    propTypes: {
        threads: React.PropTypes.array.isRequired,
        onClick: React.PropTypes.func.isRequired
    },

    render() {
        const { threads, onClick } = this.props;
        const nbComments = getNbComments(threads);

        return (
            <div className="Comment-Icon" onClick={onClick}>
                <div className="Comment-Marker">
                    {nbComments > 0 ? nbComments : '+'}
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
        sectionText:        React.PropTypes.string.isRequired,
        openArea:           React.PropTypes.number,
        highlightCommented: React.PropTypes.bool.isRequired
    },

    componentDidMount() {
        this.uniqueId = ++uniqueId;
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
        const { children, threads, sectionText,
            openArea, highlightCommented } = this.props;

        const isOpen = Boolean(openArea) && (this.uniqueId == openArea);
        const nbComments = getNbComments(threads);

        const className = classNames('Comment-Section', {
            'Comment-HasComments': nbComments > 0,
            'Comment-Highlight':   highlightCommented,
            'Comment-OpenArea':    isOpen
        });

        return (
            <div className={className}>
                { children }
            {isOpen ?
                <CommentsArea threads={threads} sectionText={sectionText} />
                : null
            }
                <Marker threads={threads} onClick={this.toggleArea} />
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
    let threads = comment.get('threads').toJS();

    // Return only threads corresponding to content
    const { children } = props;

    const sectionText = getChildrenToText(children);
    const words       = sectionText.split(' ');

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

        return (matching > 0.8);
    });

    return {
        threads,
        sectionText,
        openArea: comment.get('openArea'),
        highlightCommented: config.getIn([ 'pluginsConfig', 'comment', 'highlightCommented' ], true)
    };
}

module.exports = GitBook.connect(CommentSection, mapStateToProps);
