const GitBook   = require('gitbook-core');
const { React } = GitBook;

const getApiURL = require('../utils/getApiURL');

const Toolbar = React.createClass({
    propTypes: {
        actions:  React.PropTypes.array,
        loggedIn: React.PropTypes.bool.isRequired
    },

    render() {
        let toolbarActions = this.props.actions;
        const { loggedIn } = this.props;

        if (!loggedIn) {
            toolbarActions = [
                {
                    text: 'Sign in to GitBook.com',
                    onClick: () => {
                        window.location.href = getApiURL('login');
                    }
                }
            ];
        }

        return (
            <div className="Comment-Toolbar">
                {toolbarActions.map((action, i) => {
                    return (
                        <a key={i}
                           href="#"
                           onClick={(e) => {
                               e.preventDefault();
                               action.onClick();
                           }}
                        >
                           {action.text}
                       </a>
                    );
                })}
            </div>
        );
    }
});

function mapStateToProps({ comment }) {
    return {
        loggedIn: comment.get('loggedIn')
    };
}

module.exports = GitBook.connect(Toolbar, mapStateToProps);
