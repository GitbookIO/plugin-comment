const GitBook   = require('gitbook-core');
const { React } = GitBook;

const Toolbar = React.createClass({
    propTypes: {
        actions: React.PropTypes.array
    },

    render() {
        const toolbarActions = this.props.actions;
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

module.exports = Toolbar;
