const GitBook   = require('gitbook-core');
const { React } = GitBook;

const CommentCloser = React.createClass({
    propTypes: {
        onClick: React.PropTypes.func.isRequired
    },

    onClick(e) {
        const { onClick } = this.props;

        e.preventDefault();
        onClick();
    },

    render() {
        return (
            <div className="Comment-Closer" onClick={this.onClick} >
                <i className="fa fa-times" />
            </div>
        );
    }
});

module.exports = CommentCloser;
