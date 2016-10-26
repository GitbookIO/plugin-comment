const GitBook = require('gitbook-core');
const { React } = GitBook;

const NewThread      = require('./NewThread');
const ThreadsList    = require('./ThreadsList');
const ThreadComments = require('./ThreadComments');

const CommentsArea = React.createClass({
    propTypes: {
        threads:     React.PropTypes.array.isRequired,
        sectionText: React.PropTypes.string.isRequired
    },

    getInitialState() {
        return {
            creatingThread: false
        };
    },

    closeForm() {
        this.setState(this.getInitialState());
    },

    openForm() {
        this.setState({
            creatingThread: true
        });
    },

    render() {
        const { threads, sectionText } = this.props;
        const { creatingThread } = this.state;

        const inner = creatingThread || !threads.length ?
            <NewThread sectionText={sectionText} onCloseForm={this.closeForm} withDiscardButton={threads.length > 0} /> :
            threads.length > 1 ?
            <ThreadsList threads={threads} onNewThread={this.openForm} /> :
            <ThreadComments thread={threads[0]} onNewThread={this.openForm} />;

        return (
            <div className="Comment-CommentsArea">
                {inner}
            </div>
        );
    }
});

module.exports = CommentsArea;
