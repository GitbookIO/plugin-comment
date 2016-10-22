const GitBook   = require('gitbook-core');
const { React } = GitBook;

const actions = require('../actions');

const ThreadsFetcher = React.createClass({
    propTypes: {
        children: React.PropTypes.node.isRequired,
        dispatch: React.PropTypes.func.isRequired,
        filename: React.PropTypes.string.isRequired
    },

    componentDidMount() {
        // Preserve current filename
        this.filename = this.props.filename;
        this.fetchPageThreads();
    },

    componentWillReceiveProps(nextProps) {
        const nextFilename = nextProps.filename;
        // Update only if filename has changed
        if (nextFilename != this.filename) {
            this.filename = nextFilename;
            this.fetchPageThreads();
        }
    },

    // Make an api request
    fetchPageThreads() {
        const { dispatch } = this.props;
        dispatch(actions.fetchThreads(this.filename));
    },

    render() {
        return (
            <div>
                <GitBook.ImportCSS href="gitbook/comment/comment.css" />
                {this.props.children}
            </div>
        );
    }
});

function mapStateToProps({ file }) {
    return {
        filename: file.get('path')
    };
}

module.exports = GitBook.connect(ThreadsFetcher, mapStateToProps);
