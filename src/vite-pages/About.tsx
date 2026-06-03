import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { PageBreadcrumb } from "../components/PageBreadcrumb";

type Props = {
  onNavigate: (path: string) => void;
};

export function AboutPage({ onNavigate }: Props) {
  return (
    <>
      <SiteHeader onNavigate={onNavigate} />

      <main className="about-page" id="main-content">
        <div className="about-page__inner">
          <PageBreadcrumb
            items={[
              { href: "/", label: "Home", onClick: () => onNavigate("/") },
              { label: "About" },
            ]}
          />

          <h1 className="about-page__title">About Know Your Candidate</h1>
          <p className="about-page__lede">
            A public candidate directory built for Nigeria&apos;s elections.{" "}
            <strong>Search by name, state, local government, office, and party</strong>{" "}
            to see who is contesting and where they appear on the ballot.
          </p>

          <aside
            className="about-summary"
            aria-labelledby="about-summary-heading"
            role="region"
          >
            <h2 className="about-summary__title" id="about-summary-heading">
              Key points
            </h2>
            <div className="about-summary__body">
              <ul>
                <li>
                  Browse candidate records by state, local government, office,
                  party, or name.
                </li>
                <li>
                  The directory is meant to help voters identify who is
                  contesting, not tell them who to support.
                </li>
                <li>
                  If a candidate is missing, use the{" "}
                  <a
                    className="ds-inline-link"
                    href="/submit-candidate"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("/submit-candidate");
                    }}
                  >
                    submission form
                  </a>
                  .
                </li>
                <li>
                  If a record is wrong, use the{" "}
                  <a
                    className="ds-inline-link"
                    href="/report"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("/report");
                    }}
                  >
                    corrections page
                  </a>
                  .
                </li>
              </ul>
            </div>
          </aside>

          <div className="about-page__layout">
            <aside className="about-page__sidebar">
              <nav aria-label="On this page" className="about-inpage-nav">
                <p className="about-inpage-nav__heading">On this page</p>
                <ol className="about-inpage-nav__list">
                  <li>
                    <a className="about-inpage-nav__link" href="#what-this-is">
                      What this is
                    </a>
                  </li>
                  <li>
                    <a className="about-inpage-nav__link" href="#what-this-is-not">
                      What this is not
                    </a>
                  </li>
                  <li>
                    <a className="about-inpage-nav__link" href="#how-to-use-it">
                      How to use it
                    </a>
                  </li>
                  <li>
                    <a className="about-inpage-nav__link" href="#submissions">
                      Submissions
                    </a>
                  </li>
                  <li>
                    <a className="about-inpage-nav__link" href="#corrections">
                      Corrections
                    </a>
                  </li>
                </ol>
              </nav>
            </aside>

            <article className="about-prose">
              <section className="about-prose__section" id="what-this-is">
                <h2>What this is</h2>
                <p>
                  A directory. Not a campaign. Not a prediction market. Each
                  entry is a routing layer for voters who want to know{" "}
                  <em>who is contesting, for what office, and under which party</em>.
                </p>
                <p>
                  The purpose is simple: make candidate discovery faster,
                  especially at state and local-government level where basic
                  ballot information is often fragmented or hard to verify.
                </p>
              </section>

              <section className="about-prose__section" id="what-this-is-not">
                <h2>What this is not</h2>
                <p>
                  Not an endorsement platform. Listing a candidate here does not
                  imply approval, credibility, or electoral viability.
                </p>
                <p>
                  Not the electoral commission. Official notices, party filings,
                  and final ballot decisions remain the authority where they
                  exist.
                </p>
                <p>
                  Not a complete biography of every politician. The directory is
                  designed first for discovery and orientation.
                </p>
              </section>

              <section className="about-prose__section" id="how-to-use-it">
                <h2>How to use it</h2>
                <p>
                  Start from the{" "}
                  <a
                    className="ds-inline-link"
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("/");
                    }}
                  >
                    homepage
                  </a>{" "}
                  or jump straight into the{" "}
                  <a
                    className="ds-inline-link"
                    href="/candidates"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("/candidates");
                    }}
                  >
                    candidate directory
                  </a>
                  . Search a name, choose a state, narrow to a local government,
                  and compare who is contesting across parties.
                </p>
                <p>
                  Use the directory to confirm ballot presence, inspect candidate
                  details, and move between presidential, gubernatorial,
                  legislative, and state assembly races without losing context.
                </p>
              </section>

              <section className="about-prose__section" id="submissions">
                <h2>Submissions</h2>
                <p>
                  If a candidate or aspirant is missing, send it through the{" "}
                  <a
                    className="ds-inline-link"
                    href="/submit-candidate"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("/submit-candidate");
                    }}
                  >
                    submit candidate form
                  </a>
                  . Include the office, party, state, local government, and any
                  public references that help verify the record.
                </p>
                <p>
                  Submissions improve coverage, but they do not bypass review.
                  Records are added only after the basic contest details can be
                  checked against public information.
                </p>
              </section>

              <section className="about-prose__section" id="corrections">
                <h2>Corrections</h2>
                <p>
                  If a profile is inaccurate, outdated, duplicated, or placed in
                  the wrong race, use the{" "}
                  <a
                    className="ds-inline-link"
                    href="/report"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("/report");
                    }}
                  >
                    report an issue page
                  </a>
                  .
                </p>
                <p>
                  Corrections matter most when they are specific. Include the
                  candidate name, the field that is wrong, and the public source
                  that supports the update.
                </p>
              </section>
            </article>
          </div>
        </div>
      </main>

      <SiteFooter onNavigate={onNavigate} />
    </>
  );
}
