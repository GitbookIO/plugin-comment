require('whatwg-fetch');
const GitBook     = require('gitbook-core');
const { React }   = GitBook;
const querystring = require('querystring');

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
        return this.fetchPageThreads();
    },

    componentWillReceiveProps(nextProps) {
        // Update only if filename has changed
        if (nextProps.filename != this.filename) {
            this.filename = nextProps.filename;
            return this.fetchPageThreads();
        }
    },

    // Make an api request
    fetchPageThreads() {
        if (!window) {
            return;
        }

        const { dispatch, filename } = this.props;
        const query = {
            state: 'open',
            filename
        };

        // const apiURL = `${window.location.origin}/gitbook/api/discussions?${querystring.stringify(query)}`;
        const apiURL = `http://localhost:5000/api/book/jpreynat/the-history-of-computers/discussions?${querystring.stringify(query)}`;
        return fetch(apiURL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then((response) => {
            if (response.status >= 200 && response.status < 300) {
                const loggedIn = Boolean(response.headers.get('X-GitBook-Auth'));
                dispatch(actions.updateUserStatus(loggedIn));
            }
            else {
                const error = new Error(response.statusText);
                error.response = response;
                throw error;
            }

            return response;
        })
        .then(response => response.json())
        .then(result => dispatch(actions.updateThreads(result.list)))
        .catch((err) => {
            alert(`Error with inline comments: ${err.message}`);
            // eslint-disable-next-line no-console
            console.log(err);
        });
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
