from __future__ import annotations

import argparse
import re
from pathlib import Path

from playwright.sync_api import Page, Playwright, sync_playwright


VIEWPORTS = [
    (320, 800),
    (375, 812),
    (640, 900),
    (768, 1024),
    (1024, 768),
    (1280, 900),
    (1440, 900),
]

ROUTES = {
    "operator": ("/operator", "Fleet command center"),
    "passenger": ("/order/MC201", "Choose your meal to Langkawi"),
    "crew": ("/crew/IH307", "Meal service queue"),
    "tracker": ("/track/G2T-8501", "Meal for seat 4B"),
}


class QaFailure(AssertionError):
    pass


def wait_for_page(page: Page, expected_text: str) -> None:
    page.wait_for_load_state("load")
    page.get_by_text(expected_text, exact=False).first.wait_for(state="visible")
    page.evaluate("() => document.fonts.ready")


def assert_no_overflow(page: Page, label: str) -> None:
    dimensions = page.evaluate(
        """() => ({
          viewport: window.innerWidth,
          document: document.documentElement.scrollWidth,
          body: document.body.scrollWidth,
        })"""
    )
    widest = max(dimensions["document"], dimensions["body"])
    if widest > dimensions["viewport"] + 1:
        raise QaFailure(
            f"{label}: horizontal overflow {widest}px in {dimensions['viewport']}px viewport"
        )


def reset_demo(page: Page, base_url: str) -> None:
    response = page.request.post(
        f"{base_url}/api/demo",
        data={"type": "reset_demo"},
        headers={"Content-Type": "application/json"},
    )
    if not response.ok:
        raise QaFailure(f"Demo reset failed with HTTP {response.status}")


def responsive_matrix(page: Page, base_url: str) -> int:
    checks = 0
    for width, height in VIEWPORTS:
        page.set_viewport_size({"width": width, "height": height})
        for route_name, (route, expected_text) in ROUTES.items():
            page.goto(f"{base_url}{route}", wait_until="domcontentloaded")
            wait_for_page(page, expected_text)
            assert_no_overflow(page, f"{route_name}@{width}x{height}")
            checks += 1
    return checks


def commerce_journey(page: Page, base_url: str) -> int:
    checks = 0
    reset_demo(page, base_url)
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto(f"{base_url}/operator", wait_until="domcontentloaded")
    wait_for_page(page, "Fleet command center")

    page.get_by_role("button", name=re.compile(r"MC201.*Langkawi", re.I)).click()
    page.get_by_role("button", name="Run Operations Agent").first.click()
    page.get_by_text("Publish a 10% gate discount?", exact=False).wait_for()
    page.get_by_role("button", name="Approve and publish").click()
    page.get_by_text("10% discount published", exact=False).wait_for()
    checks += 3

    page.set_viewport_size({"width": 375, "height": 812})
    page.goto(f"{base_url}/order/MC201", wait_until="domcontentloaded")
    wait_for_page(page, "Choose your meal to Langkawi")
    page.locator('label[for="meal-curry"]').click()
    page.get_by_label("Seat number").fill("18A")
    page.get_by_role("button", name=re.compile(r"Review & reserve|Simulate checkout")).last.click()
    page.get_by_text("Your meal is reserved", exact=False).wait_for()
    tracking_link = page.get_by_role("link", name="Track my meal").get_attribute("href")
    if not tracking_link:
        raise QaFailure("Passenger checkout did not create a tracking link")
    order_id = tracking_link.rsplit("/", 1)[-1]
    checks += 3

    page.set_viewport_size({"width": 768, "height": 1024})
    page.goto(f"{base_url}/crew/MC201", wait_until="domcontentloaded")
    wait_for_page(page, "Meal service queue")
    page.get_by_role("button", name="Start service").click()
    order_card = page.locator("article").filter(has_text=order_id)
    order_card.get_by_role("button", name="Delivered").click()
    checks += 2

    page.goto(f"{base_url}{tracking_link}", wait_until="domcontentloaded")
    wait_for_page(page, "Meal delivered")
    checks += 1

    reset_demo(page, base_url)
    page.set_viewport_size({"width": 375, "height": 812})
    page.goto(f"{base_url}/track/G2T-8501", wait_until="domcontentloaded")
    wait_for_page(page, "Your selected meal is unavailable")
    page.get_by_test_id("substitute-curry").click()
    page.get_by_text("Substitute approved", exact=False).first.wait_for()
    checks += 2

    page.goto(f"{base_url}/crew/SB660", wait_until="domcontentloaded")
    wait_for_page(page, "Service pause overrides the queue")
    enabled_delivery = page.get_by_role("button", name="Delivered").and_(
        page.locator(":not([disabled])")
    )
    if enabled_delivery.count() > 0:
        raise QaFailure("SB660 exposed an enabled delivery action during the safety pause")
    checks += 1
    return checks


def run(playwright: Playwright, base_url: str, artifact_dir: Path) -> None:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    console_errors: list[str] = []
    page_errors: list[str] = []
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: page_errors.append(str(error)))

    try:
        matrix_checks = responsive_matrix(page, base_url)
        journey_checks = commerce_journey(page, base_url)
        if console_errors or page_errors:
            details = "\n".join([*(f"console: {item}" for item in console_errors), *(f"page: {item}" for item in page_errors)])
            raise QaFailure(f"Browser errors detected:\n{details}")
        print(f"PASS: {matrix_checks} responsive route checks and {journey_checks} journey checks")
    except Exception:
        artifact_dir.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(artifact_dir / "responsive-qa-failure.png"), full_page=True)
        raise
    finally:
        browser.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Gate2Tray responsive and workflow browser QA")
    parser.add_argument("--base-url", default="http://127.0.0.1:3000")
    parser.add_argument("--artifact-dir", default="artifacts/qa")
    args = parser.parse_args()

    with sync_playwright() as playwright:
        run(playwright, args.base_url.rstrip("/"), Path(args.artifact_dir))


if __name__ == "__main__":
    main()
