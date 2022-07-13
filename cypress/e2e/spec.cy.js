/**
 * SOME TESTS ARE NOT WORKING BECAUSE CYPRESS
 * RELOADS THE PAGE ON PUSH STATE CHANGE
 * CURRENTLY MANUAL TESTING IS NEEDED
 */

function stubPushState(win) {
    /*cy.stub(win.history, 'pushState', (data, unused, url) => {
        console.log("PUSHED")
    })*/
}

describe('tests', () => {

    it('simple', () => {
        cy.visit('./tests/simple/page1.html', {
            onBeforeLoad: stubPushState
        });

        cy.window().then(win => {
            win.addEventListener('flashload:navigationEnded', cy.stub().as('navigationEndedStub'))
        })

        cy.contains('Page 2').click();

        cy.get('@navigationEndedStub').should('have.been.calledOnce');

        cy.url().should('include', '/page2.html');
        cy.get('h1').should('contain', 'Oh, Hi!');
    })

    it('404', () => {

        cy.visit('./tests/404/page1.html', {onBeforeLoad: stubPushState});

        cy.window().then(win => {
            win.addEventListener('flashload:navigationStarted', cy.stub().as('navigationStartedStub'))
            win.addEventListener('flashload:navigationEnded', cy.stub().as('navigationEndedStub'))
        })

        cy.contains('Page 2').click();

        cy.get('@navigationStartedStub').should('have.been.calledOnce');

        cy.url().should('include', '/page2.html');

        cy.contains('file was not found');

    });

    it('scroll', () => {

        cy.visit('./tests/scroll/scrolled.html', {
            onBeforeLoad: stubPushState,
            onLoad(win) {
                win.scrollTo(0, win.document.getElementById("scroll-here").getBoundingClientRect().top)
            }
        });

        cy.window().then(win => {
            expect(win.scrollY).to.be.gt(0);
            cy.get('#scroll-here').isWithinViewport()
        })

        cy.contains('Go Other').click();
        cy.contains('Other Page');

        /**
         * Clicking back should preserve the scroll
         * This is usually done by the browser, so nothing much to worry about
         */

        /**
         * Manually clicking a link that takes the user to the previous
         * page should preserve the scroll
         * let's test is
         */

        /*cy.contains('back').click();

        cy.url().should('include', 'scrolled.html');

        cy.window().then(win => {
            expect(win.scrollY).to.be.gt(0);
            cy.get('#scroll-here').isWithinViewport()
        })*/

    });

    it('hash', () => {

        cy.visit('./tests/hash/index.html');

        // test 1 - scrolled to hash
        cy.contains('To hash').click();
        cy.url().should('include', 'hash.html#hash');

        cy.window().then(win => {
            expect(win.scrollY).to.be.gt(0);
            cy.get('#hash').isWithinViewport()
        })

        // test 2 - not scrolled to hash
        cy.visit('./tests/hash/index.html');
        cy.contains('To not hash').click();

        cy.url().should('include', 'hash.html');
        cy.window().its('scrollY').should('eq', 0)

    })

    it('runs scripts but skips ones with data-flashload-skip-script', () => {

        cy.visit('./tests/script/index.html', {
            onBeforeLoad(win) {
                cy.spy(win, 'alert').as('shouldRunSpy')
                cy.spy(win, 'prompt').as('shouldNotRunSpy')
            }
        });
        cy.contains('Go').click();

        cy.get('@shouldRunSpy').should('have.been.calledOnce');
        cy.get('@shouldNotRunSpy').should('not.have.been.called');

    });

})