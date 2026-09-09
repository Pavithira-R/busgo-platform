"""
Run once to seed the database with initial data.
    python seed.py
"""
import asyncio
from database import async_session, init_db
from models import *
from models.user import UserRole
from models.bus import ServiceType, SeatLayout
from utils.security import hash_password
from config import get_settings
from datetime import time

settings = get_settings()

STOPS = [
    ("Colombo Fort Bus Stand", "CMB", "Colombo"),
    ("Kandy Bus Terminal", "KDY", "Kandy"),
    ("Galle Bus Stand", "GLE", "Galle"),
    ("Jaffna Bus Terminal", "JFN", "Jaffna"),
    ("Negombo Bus Stand", "NGB", "Negombo"),
    ("Matara Bus Stand", "MTR", "Matara"),
    ("Anuradhapura New Bus Stand", "ADP", "Anuradhapura"),
    ("Trincomalee Bus Stand", "TRC", "Trincomalee"),
    ("Badulla Bus Stand", "BDL", "Badulla"),
    ("Batticaloa Bus Stand", "BTC", "Batticaloa"),
]

async def seed():
    await init_db()
    async with async_session() as db:
        # Admin
        from sqlalchemy import select
        existing = await db.execute(select(User).where(User.email == settings.admin_email))
        if not existing.scalar_one_or_none():
            db.add(User(full_name="System Admin", email=settings.admin_email,
                        hashed_password=hash_password(settings.admin_password), role=UserRole.admin, phone="+94770000000"))

        # Demo passenger
        existing = await db.execute(select(User).where(User.email == "demo@busgo.com"))
        if not existing.scalar_one_or_none():
            db.add(User(full_name="Varun Demo", email="demo@busgo.com",
                        hashed_password=hash_password("demo123"), id_number="200312345V",
                        preferred_seat_position="window"))

        # Gate staff
        existing = await db.execute(select(User).where(User.email == "gate@busgo.com"))
        if not existing.scalar_one_or_none():
            db.add(User(full_name="Gate Staff", email="gate@busgo.com",
                        hashed_password=hash_password("gate123"), role=UserRole.gate_staff))

        # Stops
        for name, code, city in STOPS:
            existing = await db.execute(select(BusStop).where(BusStop.code == code))
            if not existing.scalar_one_or_none():
                db.add(BusStop(name=name, code=code, city=city))

        await db.commit()

        # Companies
        companies_data = [
            ("CTB", "CTB", "Ceylon Transport Board — government bus operator"),
            ("Lanka Ashok Leyland", "LAL", "Premium private bus operator"),
            ("SLTB Express", "SLTB-E", "Inter-city express service"),
        ]
        for name, code, desc in companies_data:
            existing = await db.execute(select(BusCompany).where(BusCompany.code == code))
            if not existing.scalar_one_or_none():
                db.add(BusCompany(name=name, code=code, description=desc))
        await db.commit()

        # Get IDs
        ctb = (await db.execute(select(BusCompany).where(BusCompany.code == "CTB"))).scalar_one()
        lal = (await db.execute(select(BusCompany).where(BusCompany.code == "LAL"))).scalar_one()
        sltb = (await db.execute(select(BusCompany).where(BusCompany.code == "SLTB-E"))).scalar_one()

        cmb = (await db.execute(select(BusStop).where(BusStop.code == "CMB"))).scalar_one()
        kdy = (await db.execute(select(BusStop).where(BusStop.code == "KDY"))).scalar_one()
        gle = (await db.execute(select(BusStop).where(BusStop.code == "GLE"))).scalar_one()
        ngb = (await db.execute(select(BusStop).where(BusStop.code == "NGB"))).scalar_one()
        jfn = (await db.execute(select(BusStop).where(BusStop.code == "JFN"))).scalar_one()

        # Buses
        buses_data = [
            (ctb.id, "NC-1234", ServiceType.standard, SeatLayout.layout_2x2, 48, '["ac"]'),
            (ctb.id, "NC-5678", ServiceType.standard, SeatLayout.layout_2x2, 48, None),
            (lal.id, "WP-LA-0001", ServiceType.semi_luxury, SeatLayout.layout_2x2_10, 40, '["ac","wifi","charging"]'),
            (lal.id, "WP-LA-0002", ServiceType.luxury, SeatLayout.layout_2x1, 24, '["ac","wifi","charging","reclining"]'),
            (sltb.id, "EX-001", ServiceType.semi_luxury, SeatLayout.layout_2x2_10, 40, '["ac","wifi"]'),
            (sltb.id, "EX-002", ServiceType.standard, SeatLayout.layout_2x2, 48, '["ac"]'),
        ]
        for cid, num, stype, layout, seats, amenities in buses_data:
            existing = await db.execute(select(Bus).where(Bus.bus_number == num))
            if not existing.scalar_one_or_none():
                db.add(Bus(company_id=cid, bus_number=num, service_type=stype,
                           seat_layout=layout, total_seats=seats, amenities=amenities))
        await db.commit()

        # Routes
        routes_data = [
            ("R-CMB-KDY", cmb.id, kdy.id, 115, "3h 30m"),
            ("R-CMB-GLE", cmb.id, gle.id, 130, "2h 45m"),
            ("R-CMB-NGB", cmb.id, ngb.id, 37, "1h"),
            ("R-CMB-JFN", cmb.id, jfn.id, 395, "8h"),
            ("R-KDY-CMB", kdy.id, cmb.id, 115, "3h 30m"),
        ]
        for rnum, fid, tid, dist, dur in routes_data:
            existing = await db.execute(select(Route).where(Route.route_number == rnum))
            if not existing.scalar_one_or_none():
                db.add(Route(route_number=rnum, from_stop_id=fid, to_stop_id=tid, distance_km=dist, estimated_duration=dur))
        await db.commit()

        # Get bus + route IDs for schedules
        bus1 = (await db.execute(select(Bus).where(Bus.bus_number == "NC-1234"))).scalar_one()
        bus2 = (await db.execute(select(Bus).where(Bus.bus_number == "WP-LA-0001"))).scalar_one()
        bus3 = (await db.execute(select(Bus).where(Bus.bus_number == "WP-LA-0002"))).scalar_one()
        bus4 = (await db.execute(select(Bus).where(Bus.bus_number == "EX-001"))).scalar_one()
        bus5 = (await db.execute(select(Bus).where(Bus.bus_number == "NC-5678"))).scalar_one()
        bus6 = (await db.execute(select(Bus).where(Bus.bus_number == "EX-002"))).scalar_one()

        r1 = (await db.execute(select(Route).where(Route.route_number == "R-CMB-KDY"))).scalar_one()
        r2 = (await db.execute(select(Route).where(Route.route_number == "R-CMB-GLE"))).scalar_one()
        r3 = (await db.execute(select(Route).where(Route.route_number == "R-CMB-NGB"))).scalar_one()
        r4 = (await db.execute(select(Route).where(Route.route_number == "R-CMB-JFN"))).scalar_one()
        r5 = (await db.execute(select(Route).where(Route.route_number == "R-KDY-CMB"))).scalar_one()

        # Schedules
        schedules_data = [
            (r1.id, bus1.id, time(7,0), time(10,30), 550.00, "mon,tue,wed,thu,fri,sat,sun"),
            (r1.id, bus2.id, time(8,30), time(11,45), 1200.00, "mon,wed,fri,sat,sun"),
            (r1.id, bus3.id, time(9,0), time(12,0), 1800.00, "mon,thu,sat"),
            (r2.id, bus4.id, time(7,15), time(10,0), 950.00, "mon,tue,wed,thu,fri,sat,sun"),
            (r2.id, bus6.id, time(10,0), time(12,45), 700.00, "mon,tue,wed,thu,fri"),
            (r3.id, bus5.id, time(6,0), time(7,0), 300.00, "mon,tue,wed,thu,fri,sat,sun"),
            (r4.id, bus4.id, time(20,0), time(4,0), 2200.00, "mon,wed,fri"),
            (r5.id, bus1.id, time(14,0), time(17,30), 550.00, "mon,tue,wed,thu,fri,sat,sun"),
        ]
        from sqlalchemy import func
        existing_count = (await db.execute(select(func.count()).select_from(Schedule))).scalar()
        if existing_count == 0:
            for rid, bid, dep, arr, price, days in schedules_data:
                db.add(Schedule(route_id=rid, bus_id=bid, departure_time=dep, arrival_time=arr, price=price, days_of_week=days))
            await db.commit()

        print("\n*** Database seeded successfully! ***")
        print("-" * 40)
        print(f"Admin:  {settings.admin_email} / {settings.admin_password}")
        print(f"Demo:   demo@busgo.com / demo123")
        print(f"Staff:  gate@busgo.com / gate123")
        print(f"Stops:  {len(STOPS)} bus terminals")
        print(f"Companies: 3 (CTB, Lanka Ashok Leyland, SLTB Express)")
        print(f"Buses:  6 vehicles")
        print(f"Routes: 5 routes")
        print(f"Schedules: {len(schedules_data)} weekly schedules")
        print("-" * 40)

if __name__ == "__main__":
    asyncio.run(seed())
